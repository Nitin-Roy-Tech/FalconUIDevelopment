// Falcon Protocol Constants
// All command types, message types, and channel definitions

(function() {
  'use strict';

  // ── Channel Types ────────────────────────────────────────────────────────────
  window.CH = {
    COMMAND: 0,
    EVENT: 1
  };

  // ── Message Types ─────────────────────────────────────────────────────────────
  window.MSG = {
    LOGIN:      1,
    LOGOUT:     2,
    LOGIN_ACK:  3,
    LOGIN_NACK: 4
  };

  // ── Command Types ────────────────────────────────────────────────────────────
  window.CMD = {
    // User Management
    CREATE_TRADER:       1,
    UPDATE_TRADER:       2,
    DISABLE_TRADER:      3,
    RESET_PASSWORD:      5,
    GET_ALL_TRADERS:     6,
    GET_ALL_ROLES:       9,
    GET_LOGIN_HISTORY:  13,
    
    // Instruments
    LOAD_INSTRUMENTS:      20,
    DELETE_INSTRUMENTS:    21,
    GET_INSTRUMENTS:       22,
    SEARCH_INSTRUMENTS:    23,
    GET_INSTRUMENT_COUNT:  24,
    GET_SYMBOLS:           25,
    GET_EXPIRIES:          26,
    GET_STREAM_STATS:      27,
    GET_SYMBOLS_BY_STREAM: 28,
    GET_EXPIRIES_BY_STREAM:29,
    
    // Strategy
    CREATE_STRATEGY:            48,
    UPDATE_STRATEGY:            49,
    GET_ALL_STRATEGIES:         50,
    GET_ALL_INSTANCES:          51,
    CREATE_INSTANCE:            52,
    UPDATE_INSTANCE:            53,
    DELETE_INSTANCE:            54,
    ENABLE_INSTANCE:            55,
    SET_PARAMETER:              56,
    GET_PARAMETERS:             57,
    ADD_STRATEGY_INSTRUMENT:    58,
    REMOVE_STRATEGY_INSTRUMENT: 59,
    KILL_ALL_STRATEGIES:        60,
    GET_STRATEGY_INSTRUMENTS:   61,
    
    // Risk Management
    GET_GLOBAL_RISK:  40,
    SET_GLOBAL_RISK:  41,
    GET_TRADER_RISK:  42,
    SET_TRADER_RISK:  43,
    
    // Monitoring
    GET_ORDERS_BY_TRADER:  81,
    GET_ALL_POSITIONS:     83,
    GET_AUDIT_LOG:         85,
    
    // Export
    EXPORT_ORDERS:    91,
    EXPORT_POSITIONS: 93,
    
    // Settings
    GET_SETTING:      76,
    SET_SETTING:      77,
    GET_ALL_SETTINGS: 78
  };

  log('✓ Protocol constants loaded', 'info');
})();