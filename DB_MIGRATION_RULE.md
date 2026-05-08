## 스키마 변경 시 절차
1. rbs-homes/prisma/schema.prisma 수정
2. 아래 명령어 실행
   - 개발환경: npx prisma migrate dev --name 변경내용
   - 운영환경: npx prisma migrate deploy
3. admin/prisma/schema.prisma 동일하게 수정
4. admin에서 npx prisma generate 실행

## 마이그레이션 파일 명명 규칙
npx prisma migrate dev --name add_user_phone_field
npx prisma migrate dev --name remove_password_origin
## 작성일
$(date 2026-05-05)

## 작성자
MrHomes 개발팀
