// ============================================================
// Project Sentinel — Core Type Definitions
// Shared across Analyzer, Requirement Generator, Risk Engine
// ============================================================

// ---------- Module 1: AI System Analyzer ----------

export interface AIDecisionPoint {
    id: string;
    name: string;
    description: string;
    location: string; // e.g. "Section 3.2" or "User Story 4"
    autonomyLevel: "human-in-loop" | "human-on-loop" | "fully-autonomous";
    sensitiveOperation: boolean;
    criticalWorkflow: boolean;
  }
  
  export interface AnalyzerResult {
    decisionPoints: AIDecisionPoint[];
    summary: string;
  }
  
  // ---------- Module 2: Requirement Generator ----------
  
  export type RequirementCategory =
    | "human-oversight"
    | "functional"
    | "non-functional"
    | "safety"
    | "accountability";
  
  export interface GeneratedRequirement {
    id: string;
    category: RequirementCategory;
    text: string;
    relatedDecisionPointId: string;
    rationale: string;
  }
  
  export interface RequirementGeneratorResult {
    requirements: GeneratedRequirement[];
  }
  
  // ---------- Module 3: Risk Assessment Engine ----------
  
  export interface RiskFactors {
    hallucinationPossibility: number; // 0-100
    decisionCriticality: number; // 0-100
    dataSensitivity: number; // 0-100
    humanInvolvement: number; // 0-100 (higher = more human involvement = lower net risk)
  }
  
  export interface RiskAssessment {
    decisionPointId: string;
    decisionPointName: string;
    riskScore: number; // 0-100, aggregate
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    factors: RiskFactors;
    explanation: string;
  }
  
  export interface RiskAssessmentResult {
    assessments: RiskAssessment[];
    overallRiskScore: number;
  }
  
  // ---------- Module 6: Compliance Engine (lite) ----------
  
  export type EUAIActTier = "unacceptable" | "high" | "limited" | "minimal";
  
  export interface ComplianceFlag {
    decisionPointId: string;
    decisionPointName: string;
    tier: EUAIActTier;
    justification: string;
    keyObligations: string[];
  }
  
  export interface ComplianceResult {
    flags: ComplianceFlag[];
  }
  
  // ---------- Aggregated Final Report ----------
  
  export interface GovernanceReport {
    systemDescription: string;
    analyzer: AnalyzerResult;
    requirements: RequirementGeneratorResult;
    risk: RiskAssessmentResult;
    compliance: ComplianceResult;
    generatedAt: string;
  }
  
  // ---------- API request/response shapes ----------
  
  export interface AnalyzeRequestBody {
    systemDescription: string;
  }
  
  export interface GenerateRequirementsRequestBody {
    decisionPoints: AIDecisionPoint[];
  }
  
  export interface AssessRiskRequestBody {
    decisionPoints: AIDecisionPoint[];
  }
  
  export interface AssessComplianceRequestBody {
    decisionPoints: AIDecisionPoint[];
  }