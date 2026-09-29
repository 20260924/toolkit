# toolkit

로컬에서 쓰는 업무용 React 도구 모음. 런처 하나가 모든 도구를 띄우고, 도구별 API를 로컬 서버(127.0.0.1)에서 제공합니다.

## 시작하기

```sh
pnpm install
pnpm start   # 빌드 후 http://127.0.0.1:4600
pnpm dev     # 개발 모드: http://127.0.0.1:4601 (Vite HMR + API 서버 watch)
```

Node 24(`.node-version`)와 pnpm(`packageManager`, corepack)이 필요합니다.

## 명령

| 명령                          | 설명                                              |
| ----------------------------- | ------------------------------------------------- |
| `pnpm new <id> [--no-server]` | `templates/app`으로 `apps/<id>` 생성, 런처에 등록 |
| `pnpm drop <id>`              | `apps/<id>` 삭제, 런처에서 등록 해제              |
| `pnpm sync`                   | `apps/*`로부터 런처 registry와 의존성 재생성      |
| `pnpm check`                  | 포맷, 린트, 타입, 테스트, 빌드                    |
| `pnpm fmt` / `pnpm lint`      | oxfmt / oxlint                                    |

`TOOLKIT_PORT`로 포트를 바꿀 수 있습니다(개발 모드의 Vite는 그 다음 번호).

## 구조

```
launcher/          유일한 실행 앱
  src/             홈(도구 목록), 라우팅, 도구 lazy 로딩
  server/          Hono 서버: /api/<id>에 도구 API 마운트, Host/Origin 검사
apps/<id>/        도구 하나 = 패키지 하나 (@toolkit/app-<id>)
  src/manifest.ts  id, 이름, 설명 (id = 디렉터리 이름)
  src/ui/          React (브라우저)
  src/server/      Hono 서브앱 (Node, 선택)
  src/shared/      ui와 server가 공유하는 타입과 순수 로직
packages/
  tsconfig/        base / react / node
  ui/              테마 토큰(theme.css), Button, cn
  utils/           AppManifest 타입, ./browser(createApi, createStorage), ./node(appDataDir)
templates/app/    pnpm new가 복사하는 뼈대
scripts/           new / drop / sync (Node가 TS를 직접 실행)
```

## 규칙

- 패키지와 도구는 빌드하지 않습니다. TS 소스를 그대로 export하고, 브라우저 쪽은 Vite가, 서버 쪽은 Node의 타입 스트리핑이 처리합니다.
  - 그래서 enum, namespace, 생성자 파라미터 프로퍼티는 쓸 수 없습니다(`erasableSyntaxOnly`).
  - 서버 코드의 상대 import에는 `.ts` 확장자가 필요합니다(tsconfig가 강제). 일관성을 위해 UI 코드도 확장자를 붙입니다.
- `ui/`는 DOM 환경, `server/`는 Node 환경으로 따로 타입 검사합니다. `shared/`에서는 둘 다 쓰지 않습니다.
- UI에서 서버를 부를 때는 `createApi(manifest.id)`를 쓰고, 요청과 응답 타입은 `shared/`에 둡니다.
- 서버는 127.0.0.1에만 바인딩하고, 로컬이 아닌 Host(DNS rebinding)나 Origin(다른 사이트)에서 온 요청은 거부합니다. 상태를 바꾸는 라우트에는 GET을 쓰지 않습니다.
- 도구 데이터는 브라우저 쪽이면 `createStorage(id)`, 서버 쪽이면 `appDataDir(id)`(`~/.toolkit/<id>`)에 저장합니다.
- 외부 의존성 버전은 `pnpm-workspace.yaml`의 catalog에서만 관리합니다(`catalogMode: strict`).
- `launcher/src/registry.ts`와 `launcher/server/registry.ts`는 생성되는 파일이므로 직접 고치지 않습니다.
