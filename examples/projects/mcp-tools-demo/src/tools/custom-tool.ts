/**
 * Custom Tool Definitions
 *
 * This file demonstrates how to create custom tools that can be registered
 * with NeuroLink's MCP tool registry.
 */

import type { ToolDefinition } from "@juspay/neurolink";

/**
 * Weather Tool
 * A simple example tool that returns mock weather data for a location.
 */
export const weatherTool: ToolDefinition = {
  name: "getWeather",
  description:
    "Get current weather information for a specified location. Returns temperature, condition, and humidity.",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City name (e.g., 'New York', 'London', 'Tokyo')",
      },
      units: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "Temperature units (default: celsius)",
      },
    },
    required: ["location"],
  },
  execute: async ({
    location,
    units = "celsius",
  }: {
    location: string;
    units?: string;
  }) => {
    // Mock weather data - in production, this would call a real weather API
    const mockWeatherData: Record<
      string,
      { temp: number; condition: string; humidity: number }
    > = {
      "new york": { temp: 22, condition: "partly cloudy", humidity: 65 },
      london: { temp: 15, condition: "rainy", humidity: 80 },
      tokyo: { temp: 28, condition: "sunny", humidity: 70 },
      paris: { temp: 18, condition: "cloudy", humidity: 75 },
      sydney: { temp: 25, condition: "sunny", humidity: 60 },
    };

    const normalizedLocation = location.toLowerCase();
    const weather = mockWeatherData[normalizedLocation] || {
      temp: 20,
      condition: "unknown",
      humidity: 50,
    };

    let temperature = weather.temp;
    if (units === "fahrenheit") {
      temperature = Math.round((temperature * 9) / 5 + 32);
    }

    return {
      location,
      temperature,
      units,
      condition: weather.condition,
      humidity: weather.humidity,
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Stock Price Tool
 * Returns mock stock price data for a given ticker symbol.
 */
export const stockPriceTool: ToolDefinition = {
  name: "getStockPrice",
  description:
    "Get the current stock price and basic market data for a ticker symbol.",
  parameters: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Stock ticker symbol (e.g., 'AAPL', 'GOOGL', 'MSFT')",
      },
    },
    required: ["symbol"],
  },
  execute: async ({ symbol }: { symbol: string }) => {
    // Mock stock data - in production, this would call a real stock API
    const mockStockData: Record<
      string,
      { price: number; change: number; volume: string }
    > = {
      AAPL: { price: 178.5, change: 2.3, volume: "45.2M" },
      GOOGL: { price: 141.25, change: -1.15, volume: "22.1M" },
      MSFT: { price: 378.9, change: 4.2, volume: "18.5M" },
      AMZN: { price: 185.75, change: 1.85, volume: "35.8M" },
      NVDA: { price: 875.4, change: 12.5, volume: "42.3M" },
    };

    const upperSymbol = symbol.toUpperCase();
    const stock = mockStockData[upperSymbol];

    if (!stock) {
      return {
        error: `Stock symbol '${symbol}' not found`,
        suggestion: "Try AAPL, GOOGL, MSFT, AMZN, or NVDA",
      };
    }

    return {
      symbol: upperSymbol,
      price: stock.price,
      change: stock.change,
      changePercent: `${((stock.change / stock.price) * 100).toFixed(2)}%`,
      volume: stock.volume,
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Unit Converter Tool
 * Converts values between different units of measurement.
 */
export const unitConverterTool: ToolDefinition = {
  name: "convertUnits",
  description:
    "Convert values between different units of measurement (length, weight, temperature).",
  parameters: {
    type: "object",
    properties: {
      value: {
        type: "number",
        description: "The numeric value to convert",
      },
      from: {
        type: "string",
        description: "Source unit (e.g., 'km', 'miles', 'kg', 'lbs', 'C', 'F')",
      },
      to: {
        type: "string",
        description: "Target unit (e.g., 'km', 'miles', 'kg', 'lbs', 'C', 'F')",
      },
    },
    required: ["value", "from", "to"],
  },
  execute: async ({
    value,
    from,
    to,
  }: {
    value: number;
    from: string;
    to: string;
  }) => {
    const conversions: Record<string, Record<string, (v: number) => number>> = {
      // Length conversions
      km: {
        miles: (v) => v * 0.621371,
        meters: (v) => v * 1000,
        feet: (v) => v * 3280.84,
      },
      miles: {
        km: (v) => v * 1.60934,
        meters: (v) => v * 1609.34,
        feet: (v) => v * 5280,
      },
      meters: {
        km: (v) => v / 1000,
        miles: (v) => v * 0.000621371,
        feet: (v) => v * 3.28084,
      },
      feet: {
        km: (v) => v * 0.0003048,
        miles: (v) => v / 5280,
        meters: (v) => v * 0.3048,
      },

      // Weight conversions
      kg: {
        lbs: (v) => v * 2.20462,
        grams: (v) => v * 1000,
        oz: (v) => v * 35.274,
      },
      lbs: {
        kg: (v) => v * 0.453592,
        grams: (v) => v * 453.592,
        oz: (v) => v * 16,
      },
      grams: {
        kg: (v) => v / 1000,
        lbs: (v) => v * 0.00220462,
        oz: (v) => v * 0.035274,
      },

      // Temperature conversions
      C: {
        F: (v) => (v * 9) / 5 + 32,
        K: (v) => v + 273.15,
      },
      F: {
        C: (v) => ((v - 32) * 5) / 9,
        K: (v) => ((v - 32) * 5) / 9 + 273.15,
      },
      K: {
        C: (v) => v - 273.15,
        F: (v) => ((v - 273.15) * 9) / 5 + 32,
      },
    };

    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    // Handle case-insensitive matching
    const fromKey = Object.keys(conversions).find(
      (k) => k.toLowerCase() === fromLower,
    );
    if (!fromKey) {
      return { error: `Unknown source unit: ${from}` };
    }

    const toKey = Object.keys(conversions[fromKey]).find(
      (k) => k.toLowerCase() === toLower,
    );
    if (!toKey) {
      return { error: `Cannot convert from ${from} to ${to}` };
    }

    const result = conversions[fromKey][toKey](value);

    return {
      original: { value, unit: from },
      converted: { value: Math.round(result * 10000) / 10000, unit: to },
    };
  },
};

/**
 * Text Analysis Tool
 * Performs basic text analysis operations.
 */
export const textAnalysisTool: ToolDefinition = {
  name: "analyzeText",
  description:
    "Analyze text to get word count, character count, and other statistics.",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text to analyze",
      },
      options: {
        type: "object",
        properties: {
          includeWordFrequency: {
            type: "boolean",
            description: "Include word frequency analysis",
          },
          topWords: {
            type: "number",
            description: "Number of top words to return (default: 5)",
          },
        },
        description: "Analysis options",
      },
    },
    required: ["text"],
  },
  execute: async ({
    text,
    options = {},
  }: {
    text: string;
    options?: { includeWordFrequency?: boolean; topWords?: number };
  }) => {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    const result: Record<string, unknown> = {
      characterCount: text.length,
      characterCountNoSpaces: text.replace(/\s/g, "").length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordLength:
        words.length > 0
          ? Math.round(
              (words.reduce((sum, w) => sum + w.length, 0) / words.length) *
                100,
            ) / 100
          : 0,
      averageSentenceLength:
        sentences.length > 0
          ? Math.round((words.length / sentences.length) * 100) / 100
          : 0,
    };

    if (options.includeWordFrequency) {
      const frequency: Record<string, number> = {};
      words.forEach((word) => {
        const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalized.length > 0) {
          frequency[normalized] = (frequency[normalized] || 0) + 1;
        }
      });

      const topN = options.topWords || 5;
      const topWords = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([word, count]) => ({ word, count }));

      result.topWords = topWords;
    }

    return result;
  },
};

// Export all tools as an array for easy registration
export const allCustomTools: ToolDefinition[] = [
  weatherTool,
  stockPriceTool,
  unitConverterTool,
  textAnalysisTool,
];
