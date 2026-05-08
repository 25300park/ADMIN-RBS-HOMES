## 허용된 명령어 (admin에서)
```bash
npx prisma generate   # ✅ 클라이언트 재생성 (허용)
```

## 금지된 명령어 (admin에서)
```bash
npx prisma migrate dev     # ❌ 절대 실행 금지
npx prisma migrate deploy  # ❌ 절대 실행 금지
npx prisma db push         # ❌ 절대 실행 금지
```

## 마이그레이션 실행 방법
반드시 rbs-homes 프로젝트에서만 실행하세요.
```bash
cd rbs-homes
npx prisma migrate dev    # 개발환경
npx prisma migrate deploy # 운영환경
```

## 스키마 변경 시 절차
1. rbs-homes/prisma/schema.prisma 수정
2. rbs-homes에서 migrate 실행
3. admin/prisma/schema.prisma 동일하게 수정
4. admin에서 npx prisma generate 실행

## 작성일
$(date +%Y-%m-%d)

## 작성자
MrHomes 개발팀
4. admin에서 npx prisma generate 실행

## 작성일
$(date +%Y-%m-%d)

## 작성자
MrHomes 개발팀
