import { describe, it, expect } from "vitest";
import { parseCsv, validateHeaders, parseStudentRows } from "../csv-import";

describe("parseCsv", () => {
  it("parses a simple grid", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("handles quoted fields with commas", () => {
    expect(parseCsv('name,note\n"Doe, Jane",hi')).toEqual([["name", "note"], ["Doe, Jane", "hi"]]);
  });
  it("handles doubled quotes", () => {
    expect(parseCsv('q\n"she said ""hi"""')).toEqual([["q"], ['she said "hi"']]);
  });
  it("handles embedded newlines in quotes", () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([["a"], ["line1\nline2"]]);
  });
  it("normalizes CRLF", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("drops empty trailing rows", () => {
    expect(parseCsv("a\n1\n")).toEqual([["a"], ["1"]]);
  });
});

describe("validateHeaders", () => {
  it("accepts required headers in any order/case", () => {
    expect(validateHeaders(["Grade", "ParentEmail", "Name"]).ok).toBe(true);
  });
  it("rejects missing required header", () => {
    expect(validateHeaders(["name", "grade"]).ok).toBe(false);
  });
  it("rejects unknown columns", () => {
    expect(validateHeaders(["name", "grade", "parentEmail", "wat"]).ok).toBe(false);
  });
});

describe("parseStudentRows", () => {
  const header = "name,grade,parentEmail,difficulty,loginEmail,loginPassword";

  it("parses a valid row", () => {
    const { parsed, errors } = parseStudentRows(parseCsv(`${header}\nAda,4,p@x.com,2,,`));
    expect(errors).toHaveLength(0);
    expect(parsed[0]).toMatchObject({ name: "Ada", grade: 4, parentEmail: "p@x.com", difficulty: 2, loginEmail: null });
  });
  it("defaults difficulty to 1", () => {
    const { parsed } = parseStudentRows(parseCsv(`${header}\nAda,4,p@x.com,,,`));
    expect(parsed[0].difficulty).toBe(1);
  });
  it("flags out-of-range grade", () => {
    const { errors } = parseStudentRows(parseCsv(`${header}\nAda,9,p@x.com,,,`));
    expect(errors.some((e) => e.field === "grade")).toBe(true);
  });
  it("flags invalid parent email", () => {
    const { errors } = parseStudentRows(parseCsv(`${header}\nAda,4,notanemail,,,`));
    expect(errors.some((e) => e.field === "parentEmail")).toBe(true);
  });
  it("requires loginPassword when loginEmail is set", () => {
    const { errors } = parseStudentRows(parseCsv(`${header}\nAda,4,p@x.com,,kid@x.com,`));
    expect(errors.some((e) => e.field === "loginPassword")).toBe(true);
  });
  it("lowercases emails", () => {
    const { parsed } = parseStudentRows(parseCsv(`${header}\nAda,4,P@X.COM,,KID@X.COM,Passw0rd`));
    expect(parsed[0].parentEmail).toBe("p@x.com");
    expect(parsed[0].loginEmail).toBe("kid@x.com");
  });
  it("returns a fatal header error for a bad header", () => {
    const { errors } = parseStudentRows(parseCsv(`name,grade\nAda,4`));
    expect(errors[0].rowNumber).toBe(0);
  });
});
