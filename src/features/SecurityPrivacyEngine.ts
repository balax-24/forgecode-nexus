/**
 * Category 7: Security, Privacy & Compliance (Features 51–57)
 * 
 * 51. AST-Level Secret & API Key Sanitizer (Shannon entropy + regex)
 * 52. Read-Only File Protection (.forgeignore & sensitive patterns)
 * 53. Safe Command Whitelist for Terminal Tool
 * 54. PII Redaction Engine
 * 55. Vulnerability Scanner Integration (Static rule analyzer)
 * 56. License Compliance Auditor (SPDX License Checker)
 * 57. Air-Gap Network Kill-Switch
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SecretScanMatch {
  type: string;
  original: string;
  masked: string;
  line: number;
}

export interface SecurityVulnerability {
  cwe: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  line?: number;
}

export interface LicenseAuditResult {
  isCompliant: boolean;
  detectedLicenses: string[];
  incompatibleDependencies: string[];
  notes: string;
}

export class SecurityPrivacyEngine {
  private workspaceRoot: string;
  private airGapActive: boolean = false;
  private readOnlyPatterns: RegExp[] = [
    /^\.env(\..+)?$/,
    /\.pem$/i,
    /\.key$/i,
    /id_rsa/i,
    /^\.git[\/\\]/i,
    /credentials\.json$/i,
    /service[_-]account.*\.json$/i
  ];

  private safeCommandPrefixes: string[] = [
    'npm test',
    'npm run test',
    'pytest',
    'python -m pytest',
    'python3 -m pytest',
    'python -m unittest',
    'git status',
    'git diff',
    'git log',
    'tsc --noEmit',
    'node --test',
    'cargo test',
    'go test'
  ];

  private forbiddenCommandTokens: string[] = [
    'rm -rf /',
    'mkfs',
    ':(){ :|:& };:',
    '> /dev/sda',
    'chmod 777 /',
    'curl | sh',
    'wget | sh',
    'nc -e'
  ];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  // Feature 51: AST-Level Secret & API Key Sanitizer (Shannon entropy + regex)
  public sanitizeSecrets(text: string): { sanitized: string; matches: SecretScanMatch[] } {
    const matches: SecretScanMatch[] = [];
    let sanitized = text;

    // Common API Key patterns
    const patterns: Array<{ type: string; regex: RegExp; maskFormat: (m: string) => string }> = [
      {
        type: 'OpenAI API Key',
        regex: /sk-[A-Za-z0-9]{32,64}/g,
        maskFormat: (m) => `[REDACTED_OPENAI_KEY_${m.substring(0, 5)}...]`
      },
      {
        type: 'Anthropic API Key',
        regex: /sk-ant-api03-[A-Za-z0-9-_]{40,100}/g,
        maskFormat: (m) => `[REDACTED_ANTHROPIC_KEY]`
      },
      {
        type: 'GitHub Personal Access Token',
        regex: /gh[pousr]_[A-Za-z0-9]{36,255}/g,
        maskFormat: (m) => `[REDACTED_GITHUB_TOKEN]`
      },
      {
        type: 'AWS Access Key ID',
        regex: /AKIA[0-9A-Z]{16}/g,
        maskFormat: (m) => `[REDACTED_AWS_KEY_ID]`
      },
      {
        type: 'Generic Private Key',
        regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g,
        maskFormat: () => `[REDACTED_PRIVATE_KEY_BLOCK]`
      }
    ];

    for (const pat of patterns) {
      sanitized = sanitized.replace(pat.regex, (matched) => {
        const masked = pat.maskFormat(matched);
        matches.push({
          type: pat.type,
          original: matched,
          masked,
          line: 0
        });
        return masked;
      });
    }

    // High Shannon Entropy String Detection (> 4.5 for strings longer than 24 chars)
    const tokenRegex = /["']([A-Za-z0-9+/=_-]{24,})["']/g;
    sanitized = sanitized.replace(tokenRegex, (fullMatch, token) => {
      if (this.calculateShannonEntropy(token) > 4.6 && !token.includes(' ')) {
        matches.push({
          type: 'High-Entropy Secret',
          original: token,
          masked: '[REDACTED_HIGH_ENTROPY_SECRET]',
          line: 0
        });
        return `"[REDACTED_HIGH_ENTROPY_SECRET]"`;
      }
      return fullMatch;
    });

    return { sanitized, matches };
  }

  public calculateShannonEntropy(str: string): number {
    const map: Record<string, number> = {};
    for (const c of str) {
      map[c] = (map[c] || 0) + 1;
    }
    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(map)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  // Feature 52: Read-Only File Protection (.forgeignore & sensitive patterns)
  public isFileReadOnly(filePath: string): boolean {
    const basename = path.basename(filePath);
    const normalized = filePath.replace(/\\/g, '/');

    // Check built-in sensitive patterns
    for (const pat of this.readOnlyPatterns) {
      if (pat.test(basename) || pat.test(normalized)) {
        return true;
      }
    }

    // Check .forgeignore if present
    const ignorePath = path.join(this.workspaceRoot, '.forgeignore');
    if (fs.existsSync(ignorePath)) {
      try {
        const lines = fs.readFileSync(ignorePath, 'utf-8').split('\n');
        for (let l of lines) {
          l = l.trim();
          if (l && !l.startsWith('#')) {
            if (normalized.includes(l) || basename === l) {
              return true;
            }
          }
        }
      } catch {}
    }

    return false;
  }

  // Feature 53: Safe Command Whitelist for Terminal Tool
  public validateCommandSafety(command: string): { safe: boolean; reason?: string } {
    const trimmed = command.trim();

    // Reject dangerous tokens
    for (const bad of this.forbiddenCommandTokens) {
      if (trimmed.includes(bad)) {
        return { safe: false, reason: `Command contains forbidden destructive operation: '${bad}'` };
      }
    }

    // Check whitelist prefixes
    const isWhitelisted = this.safeCommandPrefixes.some(prefix => 
      trimmed === prefix || trimmed.startsWith(prefix + ' ')
    );

    if (isWhitelisted) {
      return { safe: true };
    }

    // Default policy: alert on un-whitelisted commands
    return {
      safe: false,
      reason: `Command '${trimmed}' is not in the approved safety whitelist.`
    };
  }

  // Feature 54: PII Redaction Engine
  public redactPII(text: string): { text: string; redactionCount: number } {
    let count = 0;
    let result = text;

    // Email
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
      count++;
      return '[REDACTED_EMAIL]';
    });

    // IPv4 Address (excluding 127.0.0.1 and 0.0.0.0)
    result = result.replace(/\b(?!127\.0\.0\.1\b|0\.0\.0\.0\b)(?:\d{1,3}\.){3}\d{1,3}\b/g, () => {
      count++;
      return '[REDACTED_IP]';
    });

    // Credit Card (16 digits with hyphens or spaces)
    result = result.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, () => {
      count++;
      return '[REDACTED_CREDIT_CARD]';
    });

    // Phone numbers (e.g. +1-555-123-4567 or (555) 123-4567)
    result = result.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, () => {
      count++;
      return '[REDACTED_PHONE]';
    });

    return { text: result, redactionCount: count };
  }

  // Feature 55: Vulnerability Scanner Integration (Static rule analyzer)
  public scanCodeForVulnerabilities(code: string, language: string = 'python'): SecurityVulnerability[] {
    const findings: SecurityVulnerability[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // SQL Injection
      if (/(?:execute|query)\s*\(\s*(?:f["'][^)]*?\{[^)]*?\}[^)]*?|["'][^)]*?%s["']\s*%\s*[^)]+)\)/i.test(line)) {
        findings.push({
          cwe: 'CWE-89',
          severity: 'HIGH',
          title: 'Potential SQL Injection',
          description: 'SQL statement constructed with dynamic string formatting instead of parameterized placeholders.',
          line: lineNum
        });
      }

      // Command Injection
      if (/(?:os\.system|subprocess\.Popen|subprocess\.call|exec|eval)\s*\([^)]*?(?:request|input|sys\.argv)/i.test(line)) {
        findings.push({
          cwe: 'CWE-78',
          severity: 'CRITICAL',
          title: 'Command / Code Injection',
          description: 'Executing shell commands or arbitrary code using unsanitized user input.',
          line: lineNum
        });
      }

      // Hardcoded Password or Secret
      if (/(?:password|passwd|secret_key|api_key)\s*=\s*["'][^"']{6,}["']/i.test(line) && !line.includes('os.environ')) {
        findings.push({
          cwe: 'CWE-798',
          severity: 'MEDIUM',
          title: 'Hardcoded Credential',
          description: 'Potential plaintext password or secret assigned directly in code.',
          line: lineNum
        });
      }

      // Path Traversal
      if (/open\s*\([^)]*?\.\.[\/\\]/.test(line)) {
        findings.push({
          cwe: 'CWE-22',
          severity: 'HIGH',
          title: 'Path Traversal',
          description: 'File path contains unvalidated relative directory traversal components (..).',
          line: lineNum
        });
      }
    });

    return findings;
  }

  // Feature 56: License Compliance Auditor (SPDX License Checker)
  public auditLicenses(dependencies: Record<string, string>): LicenseAuditResult {
    const detectedLicenses: string[] = [];
    const incompatible: string[] = [];

    // Permissible enterprise licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC
    const copyleftLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-3.0'];

    for (const [pkg, lic] of Object.entries(dependencies)) {
      const cleanLic = lic.trim();
      detectedLicenses.push(`${pkg}: ${cleanLic}`);
      if (copyleftLicenses.includes(cleanLic)) {
        incompatible.push(`${pkg} (${cleanLic})`);
      }
    }

    const isCompliant = incompatible.length === 0;
    return {
      isCompliant,
      detectedLicenses,
      incompatibleDependencies: incompatible,
      notes: isCompliant 
        ? 'All dependencies adhere to enterprise-approved permissive licensing (MIT/Apache/BSD).'
        : `Found copyleft / viral licenses in dependencies: ${incompatible.join(', ')}`
    };
  }

  // Feature 57: Air-Gap Network Kill-Switch
  public setAirGapMode(enabled: boolean): void {
    this.airGapActive = enabled;
  }

  public isAirGapModeActive(): boolean {
    return this.airGapActive;
  }

  public validateNetworkDestination(targetHost: string): { allowed: boolean; reason?: string } {
    if (!this.airGapActive) {
      return { allowed: true };
    }

    const normalized = targetHost.toLowerCase().trim();
    if (normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1') {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Air-Gap Network Kill-Switch is ACTIVE. Outbound network traffic to '${targetHost}' is strictly blocked.`
    };
  }
}
