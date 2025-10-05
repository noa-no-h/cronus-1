import fs from 'fs';
import path from 'path';
import os from 'os';

// Structure to store token usage information
export interface TokenUsage {
  timestamp: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  endpoint: string;
  success: boolean;
}

// Daily aggregated usage
export interface DailyUsage {
  date: string;
  totalTokens: number;
  byModel: Record<string, number>;
  byEndpoint: Record<string, number>;
  requests: number;
  failures: number;
}

// Main token usage statistics object
export interface TokenUsageStats {
  totalTokensUsed: number;
  dailyUsage: Record<string, DailyUsage>;
  modelUsage: Record<string, {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requests: number;
  }>;
  lastUpdated: Date;
}

class TokenUsageTracker {
  private usageLogs: TokenUsage[] = [];
  private dailyStats: Record<string, DailyUsage> = {};
  private modelStats: Record<string, {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requests: number;
  }> = {};
  private totalTokensUsed: number = 0;
  private logFile: string;
  private statsFile: string;
  
  constructor() {
    // Define log file paths - store them in the user's home directory under .cronus
    const dataDir = path.join(os.homedir(), '.cronus');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.logFile = path.join(dataDir, 'token-usage.log');
    this.statsFile = path.join(dataDir, 'token-usage.json');
    
    // Load existing data if available
    this.loadData();
  }
  
  private loadData(): void {
    try {
      if (fs.existsSync(this.statsFile)) {
        const statsData = fs.readFileSync(this.statsFile, 'utf8');
        const parsedData = JSON.parse(statsData);
        
        // If the file contains our full stats object
        if (parsedData.totalTokensUsed !== undefined) {
          this.dailyStats = parsedData.dailyUsage || {};
          this.modelStats = parsedData.modelUsage || {};
          this.totalTokensUsed = parsedData.totalTokensUsed || 0;
        } 
        // If it's just the daily stats from an older version
        else {
          this.dailyStats = parsedData;
          
          // Recalculate total tokens and model stats
          this.totalTokensUsed = 0;
          Object.values(this.dailyStats).forEach(day => {
            this.totalTokensUsed += day.totalTokens || 0;
            
            // Update model stats
            Object.entries(day.byModel).forEach(([model, tokens]) => {
              if (!this.modelStats[model]) {
                this.modelStats[model] = {
                  totalTokens: 0,
                  promptTokens: 0,
                  completionTokens: 0,
                  requests: 0
                };
              }
              this.modelStats[model].totalTokens += tokens;
              this.modelStats[model].requests += 1;
            });
          });
        }
      }
      
      // We don't need to load all detailed logs into memory,
      // just the stats for efficiency
    } catch (error) {
      console.error('[TokenTracker] Error loading token usage data:', error);
    }
  }
  
  private saveData(): void {
    try {
      // Save detailed log
      fs.appendFileSync(
        this.logFile,
        this.usageLogs.map(log => JSON.stringify(log)).join('\n') + '\n'
      );
      
      // Save aggregated stats
      const fullStats = this.getTokenUsageStats();
      fs.writeFileSync(this.statsFile, JSON.stringify(fullStats, null, 2));
      
      // Clear in-memory logs after saving
      this.usageLogs = [];
    } catch (error) {
      console.error('[TokenTracker] Error saving token usage data:', error);
    }
  }
  
  /**
   * Track token usage from an API call
   */
  trackUsage(data: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    endpoint: string;
    success: boolean;
  }): void {
    const usage: TokenUsage = {
      timestamp: Date.now(),
      ...data
    };
    
    // Store in memory
    this.usageLogs.push(usage);
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!this.dailyStats[today]) {
      this.dailyStats[today] = {
        date: today,
        totalTokens: 0,
        byModel: {},
        byEndpoint: {},
        requests: 0,
        failures: 0
      };
    }
    
    const dailyStat = this.dailyStats[today];
    dailyStat.totalTokens += usage.totalTokens;
    dailyStat.requests += 1;
    if (!usage.success) {
      dailyStat.failures += 1;
    }
    
    // Update by model
    if (!dailyStat.byModel[usage.model]) {
      dailyStat.byModel[usage.model] = 0;
    }
    dailyStat.byModel[usage.model] += usage.totalTokens;
    
    // Update by endpoint
    if (!dailyStat.byEndpoint[usage.endpoint]) {
      dailyStat.byEndpoint[usage.endpoint] = 0;
    }
    dailyStat.byEndpoint[usage.endpoint] += usage.totalTokens;
    
    // Update model stats
    if (!this.modelStats[usage.model]) {
      this.modelStats[usage.model] = {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requests: 0
      };
    }
    const modelStat = this.modelStats[usage.model];
    modelStat.totalTokens += usage.totalTokens;
    modelStat.promptTokens += usage.promptTokens;
    modelStat.completionTokens += usage.completionTokens;
    modelStat.requests += 1;
    
    // Update total tokens
    this.totalTokensUsed += usage.totalTokens;
    
    // Save data periodically (every 10 calls)
    if (this.usageLogs.length >= 10) {
      this.saveData();
    }
  }
  
  /**
   * Get today's token usage statistics
   */
  getTodayUsage(): DailyUsage | null {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyStats[today] || null;
  }
  
  /**
   * Get token usage for a specific date
   */
  getUsageByDate(date: string): DailyUsage | null {
    return this.dailyStats[date] || null;
  }
  
  /**
   * Get token usage for the last N days
   */
  getRecentUsage(days: number = 7): DailyUsage[] {
    const dates = Object.keys(this.dailyStats).sort().reverse().slice(0, days);
    return dates.map(date => this.dailyStats[date]);
  }
  
  /**
   * Estimate token usage based on input text length
   * This is a rough estimate for planning purposes
   */
  static estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Force save any pending logs
   */
  flush(): void {
    if (this.usageLogs.length > 0) {
      this.saveData();
    }
  }
  
  /**
   * Get complete token usage statistics
   */
  getTokenUsageStats(): TokenUsageStats {
    return {
      totalTokensUsed: this.totalTokensUsed,
      dailyUsage: this.dailyStats,
      modelUsage: this.modelStats,
      lastUpdated: new Date()
    };
  }
}

// Singleton instance
export const tokenTracker = new TokenUsageTracker();