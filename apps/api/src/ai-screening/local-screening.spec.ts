import { normalizeSkill, runLocalScreening } from "./local-screening";

describe("local screening engine", () => {
  it("normalizes skill aliases", () => {
    expect(normalizeSkill("ReactJS")).toBe("react");
    expect(normalizeSkill("JS")).toBe("javascript");
    expect(normalizeSkill("nodejs")).toBe("node.js");
    expect(normalizeSkill("Postgres")).toBe("postgresql");
  });

  it("produces a high score for a strong match", () => {
    const result = runLocalScreening(
      "Senior engineer with React, Node.js, PostgreSQL and 6 years experience",
      "Looking for React and Node.js engineer",
      {
        candidateSkills: [
          { name: "react", years: 6 },
          { name: "node.js", years: 5 },
          { name: "postgresql", years: 4 }
        ],
        requiredSkills: ["react", "node.js"],
        minExperienceYears: 3,
        education: [{ degree: "Bachelor", gpa: 3.5 }]
      }
    );

    expect(result.overall_score).toBeGreaterThanOrEqual(85);
    expect(result.matched_skills).toEqual(expect.arrayContaining(["react", "node.js"]));
    expect(result.missing_skills).toHaveLength(0);
    expect(result.grade).toMatch(/A/);
    expect(result.breakdown.skill_score).toBe(100);
    expect(result.model_version).toContain("ts");
  });

  it("flags missing required skills", () => {
    const result = runLocalScreening("Frontend dev with HTML and CSS", "Backend role", {
      candidateSkills: [{ name: "html", years: 2 }],
      requiredSkills: ["python", "postgresql", "docker"],
      minExperienceYears: 5
    });

    expect(result.missing_skills).toEqual(expect.arrayContaining(["python", "postgresql", "docker"]));
    expect(result.breakdown.skill_score).toBe(0);
    expect(result.skill_gaps.length).toBe(3);
    expect(result.concerns.some((c) => c.toLowerCase().includes("missing"))).toBe(true);
    expect(result.overall_score).toBeLessThan(65);
  });

  it("returns a full, web-ready result shape", () => {
    const result = runLocalScreening("python developer", "python role", {
      candidateSkills: [{ name: "python", years: 3 }],
      requiredSkills: ["python"],
      minExperienceYears: 2
    });

    expect(result).toMatchObject({
      overall_score: expect.any(Number),
      grade: expect.any(String),
      recommendation: expect.any(String),
      breakdown: {
        skill_score: expect.any(Number),
        experience_score: expect.any(Number),
        education_score: expect.any(Number),
        other_score: expect.any(Number)
      },
      matched_skills: expect.any(Array),
      missing_skills: expect.any(Array),
      strengths: expect.any(Array),
      concerns: expect.any(Array),
      explanation: expect.any(String),
      processing_time_ms: expect.any(Number)
    });
  });
});
