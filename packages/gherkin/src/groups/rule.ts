import { ScenarioOutline } from "./scenario-outline";
import { Scenario } from "../scenario";
import { GherkinNode } from "../gherkin-node";
import { Builder, Property } from "@autometa/dto-builder";
import { Background } from "../background";

export class Rule extends GherkinNode {
  @Property
  declare children: Array<Background | Scenario | ScenarioOutline>;
  @Property
  keyword: string;
  @Property
  name: string;
  @Property
  description: string;
}

export class RuleBuilder extends Builder(Rule) {}
