import { defineCommand } from "citty";
import { assessDbWeightCommand } from "./assess-db-weight";
import { auditVectorsCommand } from "./audit-vectors";

export const labCommand = defineCommand({
  meta: {
    name: "lab",
    description: "Experimental lab tools and database assessments",
  },
  subCommands: {
    "assess-weight": assessDbWeightCommand,
    "audit-vectors": auditVectorsCommand,
  },
});
