export interface IQR {
    key: string
    expiredAt: number
}

export interface IServiceMessage {
    success: boolean
    message: string
    value?: any
    httpCode?: number
}