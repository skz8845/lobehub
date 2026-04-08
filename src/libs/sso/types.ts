export interface SSOUserInfo {
  createDate: string;
  duty: string;
  email: string;
  idNum: string;
  idType: string;
  jobNum: string;
  name: string;
  phone: string;
  policeNum: string;
  policeType: string;
  sex: number;
  status: number;
  type: number;
  unit: string;
  updateDate: string;
  userId: number;
  uuid: string;
}

export interface SSOUserToken {
  createTime: string;
  env: string;
  expireAt: string;
  ip: string;
  mid: string;
  name: string;
  orgCode: string;
  pid: string;
  sign: string;
  userTokenId: string;
}

export interface SSOAppTokenInfo {
  appId: string;
  appTokenId: string;
  createTime: string;
  expireAt: string;
  sign: string;
  userToken: SSOUserToken;
}

export interface SSOMenu {
  appId: number;
  createDate: string;
  datasourceName: string;
  desc: string;
  filePath: string;
  icon: string;
  isShow: number;
  objectId: number;
  objectName: string;
  operatorType: string;
  parentId: number;
  permission: string;
  queryParams: string;
  routePath: string;
  sort: number;
  status: number;
  type: number;
  updateDate: string;
  uuid: string;
}

export interface SSOUserData {
  appTokenInfo: SSOAppTokenInfo;
  menus: SSOMenu[];
  permissions: string[];
  roles: string[];
  userInfo: SSOUserInfo;
}

export interface SSOResponse {
  code: string;
  data: SSOUserData;
  msg: string;
}

export interface SSOCredentials {
  appToken: string;
  userToken: string;
}

export interface SSOSession {
  appToken: string;
  email: string;
  expireAt: string;
  menus: SSOMenu[];
  name: string;
  permissions: string[];
  phone: string;
  roles: string[];
  userId: string;
  userToken: string;
}
