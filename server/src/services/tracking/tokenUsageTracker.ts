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
  dailyLimit: number;
  remainingToday: number;
  estimatedCallsLeft: number;
  averageTokensPerCall: number;
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
  
  // Default daily token limit (1 million)
  private dailyTokenLimit: number = 1000000;
  // Default average tokens per call
  private avgTokensPerCall: number = 1400;
  
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
    
    // Log remaining tokens if this is a successful call
    if (usage.success) {
      // Update the average tokens per call with a simple moving average
      this.avgTokensPerCall = (this.avgTokensPerCall * 0.9) + (usage.totalTokens * 0.1);
      
      // Calculate and log remaining tokens
      const todayTotal = this.dailyStats[today].totalTokens;
      const remaining = Math.max(0, this.dailyTokenLimit - todayTotal);
      const estimatedCalls = Math.floor(remaining / this.avgTokensPerCall);
      
      console.log(`[TokenTracker] ${usage.model}: ${usage.promptTokens} prompt + ${usage.completionTokens} completion = ${usage.totalTokens} total tokens`);
      console.log(`[TokenTracker] Today: ${todayTotal.toLocaleString()}/${this.dailyTokenLimit.toLocaleString()} tokens (${Math.round(todayTotal / this.dailyTokenLimit * 100)}% used)`);
      console.log(`[TokenTracker] Remaining: ~${estimatedCalls} more calls (assuming ~${Math.round(this.avgTokensPerCall)} tokens/call)`);
    }
    
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
    // Calculate remaining tokens and calls
    const todayUsage = this.getTodayUsage();
    const usedToday = todayUsage ? todayUsage.totalTokens : 0;
    const remaining = Math.max(0, this.dailyTokenLimit - usedToday);
    const estimatedCalls = Math.floor(remaining / this.avgTokensPerCall);
    
    return {
      totalTokensUsed: this.totalTokensUsed,
      dailyUsage: this.dailyStats,
      modelUsage: this.modelStats,
      dailyLimit: this.dailyTokenLimit,
      remainingToday: remaining,
      estimatedCallsLeft: estimatedCalls,
      averageTokensPerCall: this.avgTokensPerCall,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Set the daily token limit
   */
  setDailyLimit(limit: number): void {
    this.dailyTokenLimit = limit;
    console.log(`[TokenTracker] Daily limit set to ${limit.toLocaleString()} tokens`);
  }
  
  /**
   * Set the average tokens per call for estimation
   */
  setAvgTokensPerCall(avg: number): void {
    this.avgTokensPerCall = avg;
    console.log(`[TokenTracker] Average tokens per call set to ${avg.toLocaleString()}`);
  }
  
  /**
   * Log the current usage status including limits
   */
  logUsageStatus(): void {
    const stats = this.getTokenUsageStats();
    const todayUsage = this.getTodayUsage();
    const usedToday = todayUsage ? todayUsage.totalTokens : 0;
    
    console.log('========== TOKEN USAGE STATUS ==========');
    console.log(`Daily Limit: ${stats.dailyLimit.toLocaleString()} tokens`);
    console.log(`Used Today: ${usedToday.toLocaleString()} tokens (${Math.round(usedToday / stats.dailyLimit * 100)}%)`);
    console.log(`Remaining: ${stats.remainingToday.toLocaleString()} tokens`);
    console.log(`Avg. Per Call: ${stats.averageTokensPerCall.toLocaleString()} tokens`);
    console.log(`Est. Calls Left: ${stats.estimatedCallsLeft.toLocaleString()} calls`);
    console.log('=========================================');
  }

  /**
   * Reset daily usage statistics for the current day
   * This is useful when switching between different providers
   */
  resetDailyUsage(): void {
    const today = new Date().toISOString().split('T')[0];
    
    // If we have usage for today, subtract it from the total
    if (this.dailyStats[today]) {
      this.totalTokensUsed -= this.dailyStats[today].totalTokens;
      
      // Also subtract from model stats
      Object.entries(this.dailyStats[today].byModel).forEach(([model, tokens]) => {
        if (this.modelStats[model]) {
          this.modelStats[model].totalTokens -= tokens;
        }
      });
      
      // Reset today's stats
      this.dailyStats[today] = {
        date: today,
        totalTokens: 0,
        byModel: {},
        byEndpoint: {},
        requests: 0,
        failures: 0
      };
      
      console.log(`[TokenTracker] Reset usage statistics for ${today}`);
      
      // Save the updated stats
      this.saveData();
    }
  }
  
  /**
   * Reset usage for a specific LLM provider
   * Useful when switching between different LLM implementations
   */
  resetProviderUsage(providerPrefix: string): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we have stats for today
    if (this.dailyStats[today]) {
      // Get all models for this provider
      const providerModels = Object.keys(this.dailyStats[today].byModel)
        .filter(model => model.startsWith(providerPrefix));
      
      // Subtract usage for these models
      let tokensRemoved = 0;
      providerModels.forEach(model => {
        const modelTokens = this.dailyStats[today].byModel[model] || 0;
        tokensRemoved += modelTokens;
        
        // Update model stats
        if (this.modelStats[model]) {
          this.modelStats[model].totalTokens -= modelTokens;
        }
        
        // Remove from today's stats
        delete this.dailyStats[today].byModel[model];
      });
      
      // Update total tokens
      this.dailyStats[today].totalTokens -= tokensRemoved;
      this.totalTokensUsed -= tokensRemoved;
      
      console.log(`[TokenTracker] Reset usage statistics for provider: ${providerPrefix} (removed ${tokensRemoved.toLocaleString()} tokens)`);
      
      // Save the updated stats
      this.saveData();
    }
  }
}

// Singleton instance
export const tokenTracker = new TokenUsageTracker();