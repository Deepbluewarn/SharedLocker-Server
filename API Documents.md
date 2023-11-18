# API 정리

## 인증

### router.post("/register", registerUser);

{success: boolean, message: string}

### router.post('/login', loginUser);

{success: boolean, message: string, token: {accessToken: string, refreshToken: string}}

### router.post('/logout', logoutUser);

{success: boolean, message: string}

### router.post('/token', getNewToken);

{success: boolean, message: string, token: {accessToken: string, refreshToken: string}}

### router.get('/user', getUser);

{success: boolean, message: string}

// 로그인, 로그아웃, 토큰 요청에 대한 값을 auth 라는 queryKey 로 캐싱한다.
// 만약 여기서 404 에러가 발생하면 권한이 없으므로 로그아웃 처리한다.
