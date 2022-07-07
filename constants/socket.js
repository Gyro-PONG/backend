const SocketEvent = {
  REQUEST_USER_ID: 'requestUserId',
  RECEIVE_USER_ID: 'receiveUserId',
  REGISTER_CONTROLLER_ID: 'registerControllerId',
  RECEIVE_CONTROLLER_ID: 'receiveControllerId',
  DISCONNECT_CONTROLLER: 'disconnectController',
  REMOVE_CONTROLLER: 'removeController',
  CONTROLLER_COMPATIBILITY_SUCCESS: 'controllerCompatibilitySuccess',
  CONTROLLER_COMPATIBILITY_FAILURE: 'controllerCompatibilityFailure',
  CONTROLLER_CONNECTION_SUCCESS: 'controllerConnectionSuccess',
  CONTROLLER_CONNECTION_FAILURE: 'controllerConnectionFailure',
  ENTER_MOTION_SETTING_PAGE: 'enterMotionSettingPage',
  LOAD_CONTROLLER_MOTION_SETTING_PAGE: 'loadControllerMotionSettingPage',
  LOAD_CONTROLLER_LEFT_SETTING_PAGE: 'loadControllerLeftSettingPage',
  LOAD_CONTROLLER_RIGHT_SETTING_PAGE: 'loadControllerRightSettingPage',
  LOAD_CONTROLLER_FORWARD_SETTING_PAGE: 'loadControllerForwardSettingPage',
  LOAD_CONTROLLER_DEFAULT_PAGE: 'loadControllerDefaultPage',
  LOAD_CONTROLLER_SENSOR_ACTIVATE_PAGE: 'loadControllerSensorActivatePage',
  LOAD_CONTROLLER_SETTING_FINISH_PAGE: 'loadControllerSettingFinishPage',
  LOAD_CONTROLLER_CONNECTION_SUCCESS_PAGE:
    'loadControllerConnectionSuccessPage',
  START_MOTION_SETTING: 'startMotionSetting',
  SEND_SENSOR_DATA: 'sendSensorData',
  RECEIVE_MOTION_SETTING_BEGIN: 'receiveMotionSettingBegin',
  RECEIVE_LEFT_DATA: 'receiveLeftData',
  RECEIVE_RIGHT_DATA: 'receiveRightData',
  RECEIVE_FORWARD_DATA: 'receiveForwardData',
  SEND_EXIT: 'sendExit',
  RECEIVE_EXIT: 'receiveExit',
  SWITCH_MOTION_SETTING_PAGE: 'switchMotionSettingPage',
  RECEIVE_SWITCH_MOTION_SETTING_PAGE: 'receiveSwitchMotionSettingPage',
  CREATE_GAME: 'createGame',
  REQUEST_GAME_LIST: 'requestGameList',
  RECEIVE_GAME_LIST: 'receiveGameList',
};

Object.freeze(SocketEvent);

module.exports = SocketEvent;
