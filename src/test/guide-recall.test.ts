import {it,expect} from "vitest";
import {relevantStatements} from "@/lib/guide-recall";
it("recalls relevant older farmer statements ahead of unrelated recent statements",()=>{
  const rows=[...Array.from({length:25},(_,i)=>({text:`Unrelated recent topic ${i}`})),{text:"My tomatoes are in the north field and irrigation is limited"}];
  expect(relevantStatements(rows,"What should I do about tomatoes and irrigation?")[0]?.text).toBe("My tomatoes are in the north field and irrigation is limited");
});