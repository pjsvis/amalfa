"""
Louvain Community Detection with Misc Container Strategy.

Computes communities for the ResonanceDB knowledge graph using:
- Edge weights = confidence * veracity (Judicial Veracity formula)
- Misc container (-1) for small/isolated components
- Louvain only on main connected component(s)

Outputs partition to JSON for TypeScript to load into ResonanceDB.

Usage:
    python calc_communities.py [--resolution 1.0] [--min-component 5] [--db path/to/db]

Requirements:
    pip install networkx python-louvain
"""

import argparse
import json
import sqlite3
import sys
from pathlib import Path

try:
    import networkx as nx
    import community as community_louvain
except ImportError:
    print("❌ Missing dependencies. Run: pip install networkx python-louvain")
    sys.exit(1)


# --- Configuration ---
DEFAULT_DB = Path(__file__).parent.parent / "public" / "resonance.db"
DEFAULT_RESOLUTION = 1.0
DEFAULT_MIN_COMPONENT = 5  # Components smaller than this go to misc
MISC_COMMUNITY_ID = -1
OUTPUT_FILE = Path(__file__).parent / "community_partition.json"


def compute_communities(
    db_path: str, 
    resolution: float = DEFAULT_RESOLUTION,
    min_component_size: int = DEFAULT_MIN_COMPONENT
) -> dict:
    """
    Compute Louvain communities with Misc Container strategy.
    
    Small/isolated components are assigned to misc (-1).
    Louvain runs only on large connected components.
    
    Returns:
        dict: {node_id: community_id} where -1 = misc
    """
    print(f"🧠 Louvain Community Detection (Misc Container Strategy)")
    print(f"   Resolution: {resolution}")
    print(f"   Min component size: {min_component_size}")
    print(f"   Database: {db_path}")
    
    # Read-only connection
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Fetch edges with weights
    print("\n📊 Loading graph...")
    cursor.execute("""
        SELECT 
            source,
            target,
            COALESCE(confidence, 1.0) * COALESCE(veracity, 1.0) as weight
        FROM edges
    """)
    edges = cursor.fetchall()
    conn.close()
    
    if not edges:
        print("❌ No edges found. Run the harvester first.")
        return {}
    
    # 2. Build NetworkX Graph
    G = nx.Graph()
    for edge in edges:
        G.add_edge(edge['source'], edge['target'], weight=edge['weight'])
    
    print(f"   Total nodes: {G.number_of_nodes()}")
    print(f"   Total edges: {G.number_of_edges()}")
    
    # 3. Analyze connected components
    components = list(nx.connected_components(G))
    components.sort(key=len, reverse=True)  # Largest first
    
    print(f"\n🔗 Connected Components Analysis:")
    print(f"   Total components: {len(components)}")
    
    # Classify components
    main_components = []
    misc_nodes = set()
    
    for i, comp in enumerate(components):
        if len(comp) >= min_component_size:
            main_components.append(comp)
            print(f"   Main #{len(main_components)}: {len(comp)} nodes")
        else:
            misc_nodes.update(comp)
    
    print(f"   Misc container: {len(misc_nodes)} nodes ({len(components) - len(main_components)} small components)")
    
    # Calculate health metric
    total_nodes = G.number_of_nodes()
    misc_ratio = len(misc_nodes) / total_nodes if total_nodes > 0 else 0
    connectivity_health = (1 - misc_ratio) * 100
    
    print(f"\n📈 Graph Connectivity Health: {connectivity_health:.1f}%")
    print(f"   Misc ratio: {misc_ratio:.1%}")
    
    # 4. Run Louvain on main components only
    partition = {}
    
    # Assign misc nodes first
    for node in misc_nodes:
        partition[node] = MISC_COMMUNITY_ID
    
    # Run Louvain on each main component
    print(f"\n🧮 Running Louvain on {len(main_components)} main component(s)...")
    
    community_offset = 0
    for comp_idx, component in enumerate(main_components):
        # Create subgraph for this component
        subgraph = G.subgraph(component)
        
        try:
            sub_partition = community_louvain.best_partition(
                subgraph,
                weight='weight',
                resolution=resolution,
                random_state=42
            )
            
            # Offset community IDs to avoid collisions between components
            for node, comm_id in sub_partition.items():
                partition[node] = comm_id + community_offset
            
            num_communities = len(set(sub_partition.values()))
            community_offset += num_communities
            
            print(f"   Component {comp_idx + 1}: {num_communities} communities")
            
        except Exception as e:
            print(f"   ⚠️ Error on component {comp_idx + 1}: {e}")
            # Fallback: assign all to single community
            for node in component:
                partition[node] = community_offset
            community_offset += 1
    
    # 5. Summary
    all_communities = set(partition.values())
    real_communities = [c for c in all_communities if c != MISC_COMMUNITY_ID]
    
    print(f"\n✅ Results:")
    print(f"   Communities (excluding misc): {len(real_communities)}")
    print(f"   Misc nodes: {len(misc_nodes)}")
    
    # Community distribution
    community_sizes = {}
    for comm_id in partition.values():
        community_sizes[comm_id] = community_sizes.get(comm_id, 0) + 1
    
    print(f"\n📊 Community Distribution:")
    
    # Show misc first if exists
    if MISC_COMMUNITY_ID in community_sizes:
        print(f"   Misc (-1): {community_sizes[MISC_COMMUNITY_ID]} nodes")
    
    # Show top communities
    sorted_comms = sorted(
        [(k, v) for k, v in community_sizes.items() if k != MISC_COMMUNITY_ID],
        key=lambda x: -x[1]
    )
    for comm_id, size in sorted_comms[:10]:
        print(f"   Community {comm_id}: {size} nodes")
    
    if len(sorted_comms) > 10:
        print(f"   ... and {len(sorted_comms) - 10} more")
    
    # 6. Save partition
    print(f"\n💾 Saving partition to {OUTPUT_FILE}...")
    
    output_data = {
        "partition": partition,
        "stats": {
            "total_nodes": total_nodes,
            "misc_nodes": len(misc_nodes),
            "misc_ratio": misc_ratio,
            "connectivity_health": connectivity_health,
            "num_communities": len(real_communities),
            "num_components": len(components),
            "main_components": len(main_components)
        }
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    return partition


def main():
    parser = argparse.ArgumentParser(description="Louvain Community Detection with Misc Container")
    parser.add_argument(
        "--resolution", "-r",
        type=float,
        default=DEFAULT_RESOLUTION,
        help=f"Louvain resolution (default: {DEFAULT_RESOLUTION}). Higher = more communities."
    )
    parser.add_argument(
        "--min-component", "-m",
        type=int,
        default=DEFAULT_MIN_COMPONENT,
        help=f"Min component size to include in Louvain (default: {DEFAULT_MIN_COMPONENT})"
    )
    parser.add_argument(
        "--db",
        type=str,
        default=str(DEFAULT_DB),
        help=f"Path to SQLite database"
    )
    
    args = parser.parse_args()
    
    partition = compute_communities(args.db, args.resolution, args.min_component)
    
    if partition:
        print(f"\n✅ Done! Run TypeScript loader to persist to DB.")


if __name__ == "__main__":
    main()
