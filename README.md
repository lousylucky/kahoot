build apk 
ionic build --configuration=development
npx cap copy android
cd android
.\gradlew assembleDebug


connexion google :
cd android
.\gradlew signingReport
copie SHA1 dnas firebase
