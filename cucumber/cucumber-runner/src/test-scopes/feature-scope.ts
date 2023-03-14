import { FeatureAction } from "./types";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import { Scope } from "./scope";
import { Modifiers } from "@gherkin/types";

export class FeatureScope extends Scope {
  synchronous = true;
  #path: string;
  constructor(
    readonly action: FeatureAction,
    readonly path: string,
    public readonly modifiers?: Modifiers
  ) {
    super();
    this.#path = path;
  }

  idString = () => this.#path;

  canAttach<T extends Scope>(childScope: T): boolean {
    return (
      childScope instanceof ScenarioScope ||
      childScope instanceof StepScope ||
      childScope instanceof RuleScope
    );
  }
  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(
        `A Feature can only execute a 'Scenario', 'Scenario Outline', 'Rule' or 'Step'(Given, When etc). ${childScope.constructor.name} is not valid`
      );
    }
    super.attach(childScope);
  }
}

export class RuleScope extends Scope {
  synchronous = true;
  constructor(
    readonly title: string,
    readonly action: FeatureAction,
    public readonly modifiers?: Modifiers
  ) {
    super();
  }

  idString = () => this.title;

  canAttach<T extends Scope>(childScope: T): boolean {
    return childScope instanceof ScenarioScope || childScope instanceof StepScope;
  }
  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new Error(
        `A Feature can only execute a ${ScenarioScope.name} or ${StepScope.name}. ${childScope.constructor.name} is not valid`
      );
    }
    super.attach(childScope);
  }
}