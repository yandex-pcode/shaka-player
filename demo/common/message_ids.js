/** @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

goog.provide('shakaDemo.MessageIds');

/* eslint-disable max-len */
/** @enum {string} */
shakaDemo.MessageIds = {
  /* Features. */
  TRICK_MODE: 'DEMO_TRICK_MODE',
  XLINK: 'DEMO_XLINK',
  SUBTITLES: 'DEMO_SUBTITLES',
  CAPTIONS: 'DEMO_CAPTIONS',
  MULTIPLE_LANGUAGES: 'DEMO_MULTIPLE_LANGUAGES',
  AUDIO_ONLY: 'DEMO_AUDIO_ONLY',
  OFFLINE: 'DEMO_OFFLINE',
  STORED: 'DEMO_STORED',
  LIVE: 'DEMO_LIVE',
  WEBM: 'DEMO_WEBM',
  MP4: 'DEMO_MP4',
  MP2TS: 'DEMO_MP2TS',
  HIGH_DEFINITION: 'DEMO_HIGH_DEFINITION',
  ULTRA_HIGH_DEFINITION: 'DEMO_ULTRA_HIGH_DEFINITION',
  SURROUND: 'DEMO_SURROUND',
  DASH: 'DEMO_DASH',
  HLS: 'DEMO_HLS',
  /* Key systems. */
  WIDEVINE: 'DEMO_WIDEVINE',
  CLEAR_KEY: 'DEMO_CLEAR_KEY',
  PLAYREADY: 'DEMO_PLAYREADY',
  FAIRPLAY: 'DEMO_FAIRPLAY',
  CLEAR: 'DEMO_CLEAR',
  /* Sources. */
  UNKNOWN: 'DEMO_UNKNOWN',
  CUSTOM: 'DEMO_CUSTOM',
  SHAKA: 'DEMO_SHAKA',
  AXINOM: 'DEMO_AXINOM',
  UNIFIED_STREAMING: 'DEMO_UNIFIED_STREAMING',
  DASH_IF: 'DEMO_DASH_IF',
  WOWZA: 'DEMO_WOWZA',
  BITCODIN: 'DEMO_BITCODIN',
  NIMBLE_STREAMER: 'DEMO_NIMBLE_STREAMER',
  AZURE_MEDIA_SERVICES: 'DEMO_AZURE_MEDIA_SERVICES',
  GPAC: 'DEMO_GPAC',
  UPLYNK: 'DEMO_UPLYNK',
  APPLE: 'DEMO_APPLE',
  IRT: 'DEMO_IRT',
  /* HTML. */
  CONFIG: 'DEMO_CONFIG',
  HOME: 'DEMO_HOME',
  SEARCH: 'DEMO_SEARCH',
  CUSTOM_CONTENT: 'DEMO_CUSTOM_CONTENT',
  REPORT_BUG: 'DEMO_REPORT_BUG',
  PROJECT_LINKS_HEADER: 'DEMO_PROJECT_LINKS_HEADER',
  DOCUMENTATION: 'DEMO_DOCUMENTATION',
  LICENSE: 'DEMO_LICENSE',
  SOURCE: 'DEMO_SOURCE',
  NPM: 'DEMO_NPM',
  SUPPORT: 'DEMO_SUPPORT',
  CDN_HEADER: 'DEMO_CDN_HEADER',
  LIBRARIES: 'DEMO_LIBRARIES',
  JSDELIVR: 'DEMO_JSDELIVR',
  CDNJS: 'DEMO_CDNJS',
  DEMO_MODE_HEADER: 'DEMO_DEMO_MODE_HEADER',
  COMPILED_RELEASE: 'DEMO_COMPILED_RELEASE',
  COMPILED_DEBUG: 'DEMO_COMPILED_DEBUG',
  UNCOMPILED: 'DEMO_UNCOMPILED',
  /* Common. */
  PLAY: 'DEMO_PLAY',
  PROMPT_YES: 'DEMO_PROMPT_YES',
  PROMPT_NO: 'DEMO_PROMPT_NO',
  UNSUPPORTED_NO_OFFLINE: 'DEMO_UNSUPPORTED_NO_OFFLINE',
  UNSUPPORTED_DISABLED: 'DEMO_UNSUPPORTED_DISABLED',
  UNSUPPORTED_NO_DOWNLOAD: 'DEMO_UNSUPPORTED_NO_DOWNLOAD',
  UNSUPPORTED_NO_KEY_SUPPORT: 'DEMO_UNSUPPORTED_NO_KEY_SUPPORT',
  UNSUPPORTED_NO_LICENSE_SUPPORT: 'DEMO_UNSUPPORTED_NO_LICENSE_SUPPORT',
  UNSUPPORTED_NO_DASH_SUPPORT: 'DEMO_UNSUPPORTED_NO_DASH_SUPPORT',
  UNSUPPORTED_NO_HLS_SUPPORT: 'DEMO_UNSUPPORTED_NO_HLS_SUPPORT',
  UNSUPPORTED_NO_FORMAT_SUPPORT: 'DEMO_UNSUPPORTED_NO_FORMAT_SUPPORT',
  /* Asset card. */
  UNSUPPORTED: 'DEMO_UNSUPPORTED',
  DELETE_STORED_PROMPT: 'DEMO_DELETE_STORED_PROMPT',
  /* Front panel. */
  FRONT_INTRO_ONE: 'DEMO_FRONT_INTRO_ONE',
  FRONT_INTRO_TWO: 'DEMO_FRONT_INTRO_TWO',
  FRONT_INTRO_DISMISS: 'DEMO_FRONT_INTRO_DISMISS',
  /* Custom panel. */
  MANIFEST_URL: 'DEMO_MANIFEST_URL',
  MANIFEST_URL_ERROR: 'DEMO_MANIFEST_URL_ERROR',
  LICENSE_SERVER_URL: 'DEMO_LICENSE_SERVER_URL',
  LICENSE_CERTIFICATE_URL: 'DEMO_LICENSE_CERTIFICATE_URL',
  DRM_SYSTEM: 'DEMO_DRM_SYSTEM',
  NAME: 'DEMO_NAME',
  NAME_ERROR: 'DEMO_NAME_ERROR',
  ICON_URL: 'DEMO_ICON_URL',
  EDIT_CUSTOM: 'DEMO_EDIT_CUSTOM',
  DELETE_CUSTOM_PROMPT: 'DEMO_DELETE_CUSTOM_PROMPT',
  DELETE_CUSTOM: 'DEMO_DELETE_CUSTOM',
  CUSTOM_INTRO_ONE: 'DEMO_CUSTOM_INTRO_ONE',
  CUSTOM_INTRO_TWO: 'DEMO_CUSTOM_INTRO_TWO',
  CUSTOM_INTRO_THREE: 'DEMO_CUSTOM_INTRO_THREE',
  /* Search panel. */
  MANIFEST_SEARCH: 'DEMO_MANIFEST_SEARCH',
  CONTAINER_SEARCH: 'DEMO_CONTAINER_SEARCH',
  DRM_SEARCH: 'DEMO_DRM_SEARCH',
  SOURCE_SEARCH: 'DEMO_SOURCE_SEARCH',
  UNDEFINED: 'DEMO_UNDEFINED',
  LIVE_SEARCH: 'DEMO_LIVE_SEARCH',
  HIGH_DEFINITION_SEARCH: 'DEMO_HIGH_DEFINITION_SEARCH',
  XLINK_SEARCH: 'DEMO_XLINK_SEARCH',
  SUBTITLES_SEARCH: 'DEMO_SUBTITLES_SEARCH',
  TRICK_MODE_SEARCH: 'DEMO_TRICK_MODE_SEARCH',
  SURROUND_SEARCH: 'DEMO_SURROUND_SEARCH',
  OFFLINE_SEARCH: 'DEMO_OFFLINE_SEARCH',
  STORED_SEARCH: 'DEMO_STORED_SEARCH',
  AUDIO_ONLY_SEARCH: 'DEMO_AUDIO_ONLY_SEARCH',
  /* Config panel. */
  DELAY_LICENSE: 'DEMO_DELAY_LICENSE',
  VIDEO_ROBUSTNESS: 'DEMO_VIDEO_ROBUSTNESS',
  AUDIO_ROBUSTNESS: 'DEMO_AUDIO_ROBUSTNESS',
  IGNORE_DASH_DRM: 'DEMO_IGNORE_DASH_DRM',
  AUTO_CORRECT_DASH_DRIFT: 'DEMO_AUTO_CORRECT_DASH_DRIFT',
  XLINK_FAIL_GRACEFULLY: 'DEMO_XLINK_FAIL_GRACEFULLY',
  IGNORE_HLS_TEXT_FAILURES: 'DEMO_IGNORE_HLS_TEXT_FAILURES',
  AVAILABILITY_WINDOW_OVERRIDE: 'DEMO_AVAILABILITY_WINDOW_OVERRIDE',
  CLOCK_SYNC_URI: 'DEMO_CLOCK_SYNC_URI',
  IGNORE_DRM: 'DEMO_IGNORE_DRM',
  DEFAULT_PRESENTATION_DELAY: 'DEMO_DEFAULT_PRESENTATION_DELAY',
  IGNORE_MIN_BUFFER_TIME: 'DEMO_IGNORE_MIN_BUFFER_TIME',
  INITIAL_SEGMENT_LIMIT: 'DEMO_INITIAL_SEGMENT_LIMIT',
  DISABLE_AUDIO: 'DEMO_DISABLE_AUDIO',
  ENABLED: 'DEMO_ENABLED',
  BANDWIDTH_ESTIMATE: 'DEMO_BANDWIDTH_ESTIMATE',
  BANDWIDTH_DOWNGRADE: 'DEMO_BANDWIDTH_DOWNGRADE',
  BANDWIDTH_UPGRADE: 'DEMO_BANDWIDTH_UPGRADE',
  SWITCH_INTERVAL: 'DEMO_SWITCH_INTERVAL',
  MIN_WIDTH: 'DEMO_MIN_WIDTH',
  MAX_WIDTH: 'DEMO_MAX_WIDTH',
  MIN_HEIGHT: 'DEMO_MIN_HEIGHT',
  MAX_HEIGHT: 'DEMO_MAX_HEIGHT',
  MIN_PIXELS: 'DEMO_MIN_PIXELS',
  MAX_PIXELS: 'DEMO_MAX_PIXELS',
  MIN_BANDWIDTH: 'DEMO_MIN_BANDWIDTH',
  MAX_BANDWIDTH: 'DEMO_MAX_BANDWIDTH',
  MAX_ATTEMPTS: 'DEMO_MAX_ATTEMPTS',
  BASE_DELAY: 'DEMO_BASE_DELAY',
  BACKOFF_FACTOR: 'DEMO_BACKOFF_FACTOR',
  FUZZ_FACTOR: 'DEMO_FUZZ_FACTOR',
  TIMEOUT: 'DEMO_TIMEOUT',
  USE_PERSISTENT_LICENSES: 'DEMO_USE_PERSISTENT_LICENSES',
  MAX_SMALL_GAP_SIZE: 'DEMO_MAX_SMALL_GAP_SIZE',
  BUFFERING_GOAL: 'DEMO_BUFFERING_GOAL',
  DURATION_BACKOFF: 'DEMO_DURATION_BACKOFF',
  REBUFFERING_GOAL: 'DEMO_REBUFFERING_GOAL',
  BUFFER_BEHIND: 'DEMO_BUFFER_BEHIND',
  SAFE_SEEK_OFFSET: 'DEMO_SAFE_SEEK_OFFSET',
  STALL_THRESHOLD: 'DEMO_STALL_THRESHOLD',
  SAFE_SKIP_DISTANCE: 'DEMO_SAFE_SKIP_DISTANCE',
  ALWAYS_STREAM_TEXT: 'DEMO_ALWAYS_STREAM_TEXT',
  ALWAYS_STREAM_TEXT_WARNING: 'DEMO_ALWAYS_STREAM_TEXT_WARNING',
  JUMP_LARGE_GAPS: 'DEMO_JUMP_LARGE_GAPS',
  FORCE_TRANSMUX_TS: 'DEMO_FORCE_TRANSMUX_TS',
  START_AT_SEGMENT_BOUNDARY: 'DEMO_START_AT_SEGMENT_BOUNDARY',
  IGNORE_TEXT_FAILURES: 'DEMO_IGNORE_TEXT_FAILURES',
  STALL_DETECTOR_ENABLED: 'DEMO_STALL_DETECTOR_ENABLED',
  USE_NATIVE_HLS_SAFARI: 'DEMO_USE_NATIVE_HLS_SAFARI',
  AUDIO_LANGUAGE: 'DEMO_AUDIO_LANGUAGE',
  TEXT_LANGUAGE: 'DEMO_TEXT_LANGUAGE',
  UI_LOCALE: 'DEMO_UI_LOCALE',
  AUDIO_CHANNEL_COUNT: 'DEMO_AUDIO_CHANNEL_COUNT',
  SHAKA_CONTROLS: 'DEMO_SHAKA_CONTROLS',
  LOG_LEVEL: 'DEMO_LOG_LEVEL',
  LOG_LEVEL_INFO: 'DEMO_LOG_LEVEL_INFO',
  LOG_LEVEL_DEBUG: 'DEMO_LOG_LEVEL_DEBUG',
  LOG_LEVEL_V: 'DEMO_LOG_LEVEL_V',
  LOG_LEVEL_VV: 'DEMO_LOG_LEVEL_VV',
  DRM_SECTION_HEADER: 'DEMO_DRM_SECTION_HEADER',
  MANIFEST_SECTION_HEADER: 'DEMO_MANIFEST_SECTION_HEADER',
  ADAPTATION_SECTION_HEADER: 'DEMO_ADAPTATION_SECTION_HEADER',
  OFFLINE_SECTION_HEADER: 'DEMO_OFFLINE_SECTION_HEADER',
  STREAMING_SECTION_HEADER: 'DEMO_STREAMING_SECTION_HEADER',
  LANGUAGE_SECTION_HEADER: 'DEMO_LANGUAGE_SECTION_HEADER',
  RESTRICTIONS_SECTION_HEADER: 'DEMO_RESTRICTIONS_SECTION_HEADER',
  ADAPTATION_RESTRICTIONS_SECTION_HEADER: 'DEMO_ADAPTATION_RESTRICTIONS_SECTION_HEADER',
  DRM_RETRY_SECTION_HEADER: 'DEMO_DRM_RETRY_SECTION_HEADER',
  MANIFEST_RETRY_SECTION_HEADER: 'DEMO_MANIFEST_RETRY_SECTION_HEADER',
  STREAMING_RETRY_SECTION_HEADER: 'DEMO_STREAMING_RETRY_SECTION_HEADER',
  NUMBER_DECIMAL_WARNING: 'DEMO_NUMBER_DECIMAL_WARNING',
  NUMBER_INTEGER_WARNING: 'DEMO_NUMBER_INTEGER_WARNING',
  NUMBER_NONZERO_DECIMAL_WARNING: 'DEMO_NUMBER_NONZERO_DECIMAL_WARNING',
  NUMBER_NONZERO_INTEGER_WARNING: 'DEMO_NUMBER_NONZERO_INTEGER_WARNING',
};
/* eslint-enable max-len */
