export interface IQR {
    key: string
    expiredAt: number
}

export interface IServiceMessage {
    success: boolean
    message: string
    data?: any
    httpCode?: number
}