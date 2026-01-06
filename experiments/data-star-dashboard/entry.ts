// POLYVIS CUSTOM DATASTAR BUILD
// Context: experiments/data-star-dashboard/entry.ts

// Engine
import { apply, load, setAlias } from '../../node_modules/@starfederation/datastar/dist/engine/engine.js';

// Plugins
import { GET } from '../../node_modules/@starfederation/datastar/dist/plugins/official/backend/actions/get.js';
import { MergeSignals } from '../../node_modules/@starfederation/datastar/dist/plugins/official/backend/watchers/mergeSignals.js';
import { MergeFragments } from '../../node_modules/@starfederation/datastar/dist/plugins/official/backend/watchers/mergeFragments.js';
import { Signals } from '../../node_modules/@starfederation/datastar/dist/plugins/official/core/attributes/signals.js';
import { Computed } from '../../node_modules/@starfederation/datastar/dist/plugins/official/core/attributes/computed.js';
import { Star } from '../../node_modules/@starfederation/datastar/dist/plugins/official/core/attributes/star.js';
import { Text } from '../../node_modules/@starfederation/datastar/dist/plugins/official/dom/attributes/text.js';
import { OnLoad } from '../../node_modules/@starfederation/datastar/dist/plugins/official/browser/attributes/onLoad.js';
import { On } from '../../node_modules/@starfederation/datastar/dist/plugins/official/dom/attributes/on.js';
import { Class } from '../../node_modules/@starfederation/datastar/dist/plugins/official/dom/attributes/class.js';
import { Attr } from '../../node_modules/@starfederation/datastar/dist/plugins/official/dom/attributes/attr.js';
import { Bind } from '../../node_modules/@starfederation/datastar/dist/plugins/official/dom/attributes/bind.js';

// Load All Plugins
load(
    Star, 
    Signals, 
    Computed, 
    GET, 
    MergeSignals, 
    MergeFragments,
    Text,
    OnLoad,
    On,
    Class,
    Attr,
    Bind
);

// Make global
(window as any).Datastar = { apply, load, setAlias };

// Auto-start
apply();
