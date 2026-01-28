// Load environment variables


module.exports = {
  // AI Model Configurations
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'your_gemini_api_key_here',
    defaultModel: 'gemini-2.5-flash',
    temperature: 0.7,
    maxOutputTokens: 65565
  },

  claude: {
    apiKey: process.env.CLAUDE_API_KEY || 'your_claude_api_key_here',
    defaultModel: 'claude-sonnet-4-5',
    maxTokens: 8192,
    temperature: 0.7,
    // Files API beta header (required for file_id references)
    betaHeaders: ['files-api-2025-04-14']
  },

  // Mandy agent configuration (legacy compatibility)
  mandy: {
    apiKey: process.env.A1ZAP_API_KEY || 'your_a1zap_api_key_here',
    agentId: process.env.MANDY_AGENT_ID || 'your_mandy_agent_id_here',
    apiUrl: 'https://api.a1zap.com/v1/messages/individual'
  },

  // Agent-Specific A1Zap Configurations
  agents: {
    claudeDocubot: {
      apiKey: process.env.A1ZAP_API_KEY || 'your_a1zap_api_key_here',
      agentId: process.env.A1ZAP_AGENT_ID || 'your_agent_id_here',
      apiUrl: 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'claude-docubot'
    },

    brandonEats: {
      apiKey: process.env.BRANDONEATS_API_KEY || 'your_brandoneats_api_key_here',
      agentId: process.env.BRANDONEATS_AGENT_ID || 'your_brandoneats_agent_id_here',
      apiUrl: process.env.BRANDONEATS_API_URL || 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'brandoneats'
    },
    
    willWanderForFood: {
      apiKey: process.env.WILLWANDERFORFOOD_API_KEY || 'your_will_wander_for_food_api_key_here',
      agentId: process.env.WILLWANDERFORFOOD_AGENT_ID || 'your_will_wander_for_food_agent_id_here',
      apiUrl: process.env.WILLWANDERFORFOOD_API_URL || 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'willwanderforfood'
    },

    makeupArtist: {
      apiKey: process.env.MAKEUP_ARTIST_API_KEY || process.env.A1ZAP_API_KEY || 'your_makeup_artist_api_key_here',
      agentId: process.env.MAKEUP_ARTIST_AGENT_ID || 'your_makeup_artist_agent_id_here',
      apiUrl: process.env.MAKEUP_ARTIST_API_URL || 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'makeup-artist'
    },

    ycPhotographer: {
      apiKey: process.env.YC_PHOTOGRAPHER_API_KEY || process.env.A1ZAP_API_KEY || 'your_yc_photographer_api_key_here',
      agentId: process.env.YC_PHOTOGRAPHER_AGENT_ID || 'your_yc_photographer_agent_id_here',
      apiUrl: process.env.YC_PHOTOGRAPHER_API_URL || 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'yc-photographer'
    },

    zapbankRep: {
      apiKey: process.env.ZAPBANK_REP_API_KEY || process.env.A1ZAP_API_KEY || 'your_zapbank_rep_api_key_here',
      agentId: process.env.ZAPBANK_REP_AGENT_ID || 'your_zapbank_rep_agent_id_here',
      apiUrl: process.env.ZAPBANK_REP_API_URL || 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'zapbank-rep'
    },

    richContentDemo: {
      apiKey: process.env.RICH_CONTENT_DEMO_API_KEY || process.env.A1ZAP_API_KEY || 'your_rich_content_demo_api_key_here',
      agentId: process.env.RICH_CONTENT_DEMO_AGENT_ID || 'your_rich_content_demo_agent_id_here',
      apiUrl: process.env.RICH_CONTENT_DEMO_API_URL || 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'rich-content-demo'
    },

    mandy: {
      apiKey: process.env.A1ZAP_API_KEY || 'your_a1zap_api_key_here',
      agentId: process.env.MANDY_AGENT_ID || 'your_mandy_agent_id_here',
      apiUrl: 'https://api.a1zap.com/v1/messages/individual',
      agentName: 'mandy',
      // Mini App configuration - includes metadata for rich content blocks
      // Each mini app needs: id, handle, name (and optionally iconUrl, description)
      miniApps: {
        // NOTE: If you don't have handles/names yet, we set safe placeholders.
        // A1Zap instance cards require `handle` + `name` in the rich content block.
        // If you later provide real handles/names, swap them in here.

        miniApp01: {
          id: process.env.MINI_APP_01_ID || 'xs70yppf0aw3tmjp4qjzp9q3mx7ybz0m',
          handle: process.env.MINI_APP_01_HANDLE || 'click-splosion',
          name: process.env.MINI_APP_01_NAME || 'Click Splosion'
        },
        miniApp02: {
          id: process.env.MINI_APP_02_ID || 'xs7dajn935m7ggcx6z7r0kbkg97ybnz1',
          handle: process.env.MINI_APP_02_HANDLE || 'neon-boost',
          name: process.env.MINI_APP_02_NAME || 'Neon Boost'
        },
        miniApp03: {
          id: process.env.MINI_APP_03_ID || 'xs7b4aygw46wpbqrpgh69vr63s7yajdv',
          handle: process.env.MINI_APP_03_HANDLE || 'smoothy-ship',
          name: process.env.MINI_APP_03_NAME || 'Smoothy Ship'
        },
        miniApp04: {
          id: process.env.MINI_APP_04_ID || 'xs74eekm23hmv6vtetp69v10eh7y9fz9',
          handle: process.env.MINI_APP_04_HANDLE || 'word-vaporizer',
          name: process.env.MINI_APP_04_NAME || 'Word Vaporizer'
        },
        miniApp05: {
          id: process.env.MINI_APP_05_ID || 'xs7cssxv0ebqw583ca4prgfvnx7ycm8r',
          handle: process.env.MINI_APP_05_HANDLE || 'daily-draw',
          name: process.env.MINI_APP_05_NAME || 'Daily Draw'
        },
        miniApp06: {
          id: process.env.MINI_APP_06_ID || 'xs74xbr5qj3q6s4kwz6ab8nq317ydtdh',
          handle: process.env.MINI_APP_06_HANDLE || 'swing-stop',
          name: process.env.MINI_APP_06_NAME || 'Swing Stop'
        },
        miniApp07: {
          id: process.env.MINI_APP_07_ID || 'xs70nszrhzz10c2ndme61wy2817ycppj',
          handle: process.env.MINI_APP_07_HANDLE || 'ephemeral-blessings-streaks',
          name: process.env.MINI_APP_07_NAME || 'Ephemeral Blessings Streaks'
        },
        miniApp08: {
          id: process.env.MINI_APP_08_ID || 'xs7ajn4n8pe87wjdxey835jxkx7ycr3c',
          handle: process.env.MINI_APP_08_HANDLE || 'sparkle-entry',
          name: process.env.MINI_APP_08_NAME || 'Sparkle Entry'
        },
        miniApp09: {
          id: process.env.MINI_APP_09_ID || 'xs73ffx10j9nev81f0g576vhen7y7kdp',
          handle: process.env.MINI_APP_09_HANDLE || 'word-shower',
          name: process.env.MINI_APP_09_NAME || 'Word Shower'
        },
        miniApp10: {
          id: process.env.MINI_APP_10_ID || 'xs7ar370gn1aebzkz5753fddh17y07ag',
          handle: process.env.MINI_APP_10_HANDLE || 'vibe-blaster',
          name: process.env.MINI_APP_10_NAME || 'Vibe Blaster'
        },
        miniApp11: {
          id: process.env.MINI_APP_11_ID || 'xs7cyy3am9sqax67bwpby0t7bn7yfpa7',
          handle: process.env.MINI_APP_11_HANDLE || 'anonpost',
          name: process.env.MINI_APP_11_NAME || 'AnonPost'
        },
        miniApp12: {
          id: process.env.MINI_APP_12_ID || 'xs74n3mf1fb9qqr7xsky0wfkxx7yfgxq',
          handle: process.env.MINI_APP_12_HANDLE || 'swamp-digger',
          name: process.env.MINI_APP_12_NAME || 'Swamp Digger'
        },
        miniApp13: {
          id: process.env.MINI_APP_13_ID || 'xs77enqnwza1t1km1z1nmtcdeh7ye70f',
          handle: process.env.MINI_APP_13_HANDLE || 'clown-toss-physics',
          name: process.env.MINI_APP_13_NAME || 'Clown Toss Physics'
        },
        miniApp14: {
          id: process.env.MINI_APP_14_ID || 'xs7bjn2zrsttxhawz9p90r6rrh7ybp5x',
          handle: process.env.MINI_APP_14_HANDLE || 'fluid-flows',
          name: process.env.MINI_APP_14_NAME || 'Fluid Flows'
        },
        miniApp15: {
          id: process.env.MINI_APP_15_ID || 'xs725h596q3ksbjw5kehbjbaa97z3w38',
          handle: process.env.MINI_APP_15_HANDLE || 'rate-my-rent',
          name: process.env.MINI_APP_15_NAME || 'Rate My Rent'
        }
      }
    }
  },

  // Legacy compatibility (deprecated - use config.agents instead)
  a1zap: {
    apiKey: process.env.A1ZAP_API_KEY || 'your_a1zap_api_key_here',
    agentId: process.env.A1ZAP_AGENT_ID || 'your_agent_id_here',
    apiUrl: 'https://api.a1zap.com/v1/messages/individual'
  },
  brandonEats: {
    apiKey: process.env.BRANDONEATS_API_KEY || 'your_brandoneats_api_key_here',
    agentId: process.env.BRANDONEATS_AGENT_ID || 'your_brandoneats_agent_id_here',
    apiUrl: process.env.BRANDONEATS_API_URL || 'https://api.a1zap.com/v1/messages/individual'
  },
  makeupArtist: {
    apiKey: process.env.MAKEUP_ARTIST_API_KEY || process.env.A1ZAP_API_KEY || 'your_makeup_artist_api_key_here',
    agentId: process.env.MAKEUP_ARTIST_AGENT_ID || 'your_makeup_artist_agent_id_here',
    apiUrl: process.env.MAKEUP_ARTIST_API_URL || 'https://api.a1zap.com/v1/messages/individual'
  },
  ycPhotographer: {
    apiKey: process.env.YC_PHOTOGRAPHER_API_KEY || process.env.A1ZAP_API_KEY || 'your_yc_photographer_api_key_here',
    agentId: process.env.YC_PHOTOGRAPHER_AGENT_ID || 'your_yc_photographer_agent_id_here',
    apiUrl: process.env.YC_PHOTOGRAPHER_API_URL || 'https://api.a1zap.com/v1/messages/individual'
  },
  zapbankRep: {
    apiKey: process.env.ZAPBANK_REP_API_KEY || process.env.A1ZAP_API_KEY || 'your_zapbank_rep_api_key_here',
    agentId: process.env.ZAPBANK_REP_AGENT_ID || 'your_zapbank_rep_agent_id_here',
    apiUrl: process.env.ZAPBANK_REP_API_URL || 'https://api.a1zap.com/v1/messages/individual'
  },

  // File Registry Configuration
  files: {
    registryPath: './files-registry.json'
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },

  // Helper functions for validation
  validation: {
    /**
     * Check if a value is a placeholder (not properly configured)
     */
    isPlaceholder(value) {
      if (!value) return true;
      const placeholder_prefixes = [
        'your_',
        'YOUR_',
      ];
      return placeholder_prefixes.some(p => String(value).startsWith(p));
    },

    /**
     * Validate agent configuration
     */
    validateAgent(agentName, agentConfig) {
      const warnings = [];
      const errors = [];

      if (this.isPlaceholder(agentConfig.apiKey)) {
        errors.push(`❌ ${agentName}: API Key is not configured (using placeholder value)`);
      }

      if (this.isPlaceholder(agentConfig.agentId)) {
        errors.push(`❌ ${agentName}: Agent ID is not configured (using placeholder value)`);
      }

      return { warnings, errors };
    },

    /**
     * Validate AI service configuration
     */
    validateAIService(serviceName, serviceConfig) {
      const warnings = [];
      const errors = [];

      if (this.isPlaceholder(serviceConfig.apiKey)) {
        warnings.push(`⚠️  ${serviceName}: API Key is not configured (using placeholder value)`);
      }

      return { warnings, errors };
    }
  }
};
