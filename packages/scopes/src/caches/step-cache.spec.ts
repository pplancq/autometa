import { StepScope } from "src/step-scope";
import { describe, expect, it } from "vitest";
import { StepCache } from "./step-cache";
import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { StepKeyword, StepType } from "@autometa/gherkin";
describe("StepCache", () => {
  describe("add", () => {
    it("should add a new step to the cache", () => {
      const sut = new StepCache();
      const step = makeStep("Given", "Context", "hello there");
      sut.add(step);
      const [cached] = getList(sut, "Context");
      expect(sut.size).toEqual(1);
      expect(step).toEqual(cached);
    });

    it("should throw an error if a duplicate step is added", () => {
      const sut = new StepCache();
      const step = makeStep("Given", "Context", "hello there");
      const second = makeStep("Given", "Context", "hello there");
      sut.add(step);
      expect(() => sut.add(second)).toThrow(
        "Step [Given hello there] already defined"
      );
    });

    it("should throw an error if a duplicate step exists in the parent cache", () => {
      const parent = new StepCache();
      const sut = new StepCache(parent);
      const step = makeStep("Given", "Context", "hello there");
      const second = makeStep("Given", "Context", "hello there");
      parent.add(step);
      expect(() => sut.add(second)).toThrow(
        "Step [Given hello there] already defined"
      );
    });
  });
  describe("find", () => {
    it("should throw an error if no step can be found", () => {
      const sut = new StepCache();
      const action = () => sut.find("Context", "Given", "hello world");
      expect(action).toThrow(
        "No stored step could be found matching [Given hello world"
      );
    });
    it("should find a matching step", () => {
      const sut = new StepCache();
      const step = makeStep("Given", "Context", "hello world");
      sut.add(step);
      const found = sut.find("Context", "Given", "hello world");
      expect(found?.step).toEqual(step);
    });
    it("should find a matching parent step", () => {
      const parent = new StepCache();
      const sut = new StepCache(parent);
      const step = makeStep("Given", "Context", "hello world");
      parent.add(step);
      const found = sut.find("Context", "Given", "hello world");
      expect(found?.step).toEqual(step);
    });

    it("should extract the step args from a step", () => {
      const sut = new StepCache();
      const step = makeStep("Given", "Context", "hello {string} {int}");
      sut.add(step);
      const found = sut.find("Context", "Given", "hello 'world' 1");
      expect(found?.args).toEqual(["world", 1]);
    });
  });
});

function makeStep(keyword: StepKeyword, context: StepType, text: string) {
  return new StepScope(
    keyword,
    context,
    new CucumberExpression(text, new ParameterTypeRegistry()),
    () => undefined
  );
}

function getList(cache: StepCache, type: StepType): StepScope[] {
  const asRecord = cache as unknown as Record<StepType, unknown>;
  return asRecord[type] as StepScope[];
}