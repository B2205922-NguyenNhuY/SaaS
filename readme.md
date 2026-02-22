mkdir saas-backend && cd saas-backend
npm init -y
npm i express mysql2 dotenv cors jsonwebtoken zod
npm i -D nodemon
mkdir -p src/config src/routes src/controllers src/middleware
npx gitignore node

node -e "console.log(require('jsonwebtoken').sign({user_id:1,tenant_id:1,permissions:['CREATE_MARKET','VIEW_MARKET','UPDATE_MARKET','LOCK_MARKET','CREATE_ZONE','VIEW_ZONE','UPDATE_ZONE','LOCK_ZONE','CREATE_KIOSK_TYPE','VIEW_KIOSK_TYPE','UPDATE_KIOSK_TYPE','DELETE_KIOSK_TYPE','CREATE_KIOSK','VIEW_KIOSK','UPDATE_KIOSK','LOCK_KIOSK','CREATE_MERCHANT','VIEW_MERCHANT','UPDATE_MERCHANT','ASSIGN_KIOSK','VIEW_ASSIGNMENT']}, 'super_secret_key'))"
