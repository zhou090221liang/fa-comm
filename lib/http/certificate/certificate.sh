# 生成私钥
openssl ecparam -name prime256v1 -genkey -noout > webserver.privatekey.pem
# 生成证书
openssl req -new -x509 -sha256 -key webserver.privatekey.pem -out webserver.x509.pem -days 36500 -subj "/C=CA/ST=CA/L=CA/O=CA/OU=CA/CN=CA"
# 将私钥转化为pkcs#8格式
openssl pkcs8 -in webserver.privatekey.pem -topk8 -outform DER -out webserver.privatekey.pk8 -nocrypt