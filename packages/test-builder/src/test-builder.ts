import {
  FeatureScope,
  GlobalScope,
  RuleScope} from "@autometa/scopes";
import {
  BackgroundBridge,
  ExamplesBridge,
  FeatureBridge,
  GherkinCodeBridge,
  RuleBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
  StepBridge
} from "./bridges";
import { GherkinWalker } from "./gherkin-walker";
import { scope } from "./scope-search";
import { Bind } from "@autometa/bind-decorator";
import { Feature } from "@autometa/gherkin";
import { raise } from "@autometa/errors";

export class TestBuilder {
  constructor(global: GlobalScope, readonly feature: Feature) {
    global.onFeatureExecuted = this.onFeatureExecuted;
  }
  @Bind
  onFeatureExecuted(featureScope: FeatureScope) {
    const bridge = new FeatureBridge();
    GherkinWalker.walk<GherkinCodeBridge>(
      {
        onFeature: (feature, accumulator) => {
          accumulator.data = { gherkin: feature, scope: featureScope };
          return accumulator;
        },
        onRule: (rule, accumulator) => {
          const ruleScope = scope(featureScope).findRule(
            rule.name
          ) as RuleScope;
          const bridge = new RuleBridge();
          bridge.data = { gherkin: rule, scope: ruleScope };
          (accumulator as FeatureBridge).rules.push(bridge);
          return bridge;
        },
        onScenario: (gherkin, accumulator) => {
          const scenarioScope = scope(accumulator.data.scope).findScenario(
            gherkin.name
          );
          const bridge = new ScenarioBridge();
          bridge.data = { gherkin, scope: scenarioScope };
          (accumulator as FeatureBridge | RuleBridge).scenarios.push(bridge);
          // if accumulator is a outline, push to examples

          return bridge;
        },
        onScenarioOutline: (gherkin, accumulator) => {
          const outlineScope = scope(
            accumulator.data.scope
          ).findScenarioOutline(gherkin.name);
          const bridge = new ScenarioOutlineBridge();
          bridge.data = { gherkin, scope: outlineScope };
          (accumulator as FeatureBridge | RuleBridge).scenarios.push(bridge);
          return bridge;
        },
        onExamples: (gherkin, accumulator) => {
          const outlineScope = scope(
            accumulator.data.scope
          ).findScenarioOutline(gherkin.name);
          const bridge = new ExamplesBridge();
          bridge.data = { gherkin, scope: outlineScope };
          (accumulator as ScenarioOutlineBridge).examples.push(bridge);
          return bridge;
        },
        onExample(gherkin, accumulator) {
          const exampleScope = scope(accumulator.data.scope).findExample(
            gherkin.name
          );
          const bridge = new ScenarioBridge();
          bridge.data = { gherkin, scope: exampleScope };
          const acc = accumulator as ExamplesBridge;
          acc.scenarios.push(bridge);
          return bridge;
        },
        onBackground(gherkin, accumulator) {
          const backgroundScope = scope(accumulator.data.scope).findBackground({
            name: gherkin.name
          });
          const bridge = new BackgroundBridge();
          bridge.data = { gherkin, scope: backgroundScope };
          const acc = accumulator as FeatureBridge | RuleBridge;
          acc.background = bridge;
          return bridge;
        },
        onStep: (step, accumulator) => {
          const {
            data: { scope: parentScope }
          } = accumulator;
          const { keyword, keywordType, text } = step;
          const cache = parentScope.stepCache;
          const existingStep = cache.find(keywordType, keyword, text);
          const bridge = new StepBridge();
          const acc = accumulator as
            | BackgroundBridge
            | ScenarioBridge
            | RuleBridge
            | FeatureBridge;

          if (existingStep) {
            bridge.data = {
              gherkin: step,
              scope: existingStep.step,
              args: existingStep.args
            };
          } else {
            raise(`No step definition matching ${step.keyword} ${step.text}`);
          }

          acc.steps.push(bridge);
          return accumulator;
        }
      },
      this.feature,
      bridge
    );
    return bridge;
  }
}