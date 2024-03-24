# SharedLocker-Server

이 프로젝트는 공유 보관함 서비스의 백엔드 부분을 담당합니다.

프론트엔드 부분은 [여기](https://github.com/Deepbluewarn/SharedLocker)를 참고하세요.

프로젝트의 전반적인 설명 또한 위 저장소에서 볼 수 있습니다.

## 사용법

필요한 환경 변수는 아래와 같습니다.

프로젝트 루트에 .env 파일을 생성하고 아래 항목을 작성합니다.

JWT 관련 문서는 [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) 를 참고하세요.

|값|설명|
|---|---|
|JWT_EXPIRATION_TIME| JWT Tokne의 유효시간을 설정합니다.|
|JWT_REFRESH_EXPIRATION_TIME| JWT Refresh Token 의 expiresIn 속성을 설정합니다.|
|JWT_SECRET| JWT Token 에 서명하고 검증하기 위한 Secret 값 입니다.|
|QR_EXPIRATION_TIME| QR Key 값의 유효시간을 설정합니다.|
|DB_CONNECTION| MongoDB 연결 주소입니다.|
|QR_REDIS_AUTH| QR 관련 데이터를 저장하는 Redis 서버의 비밀번호입니다.|

### 빌드
```bash
npm run build
```

### 개발 환경으로 실행
```bash
npm run dev
```