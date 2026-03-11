build apk 
ionic build --configuration=development
npx cap copy android
cd android
.\gradlew assembleDebug