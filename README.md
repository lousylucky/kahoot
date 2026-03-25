build apk 
ionic build --configuration=development
npx cap copy android
cd android
.\gradlew assembleDebug


connexion google :
cd android
.\gradlew signingReport
copie SHA1 dnas firebase



npm install
firebase logout
firebase login
cd .\functions\
firebase deploy --only functions
ou
firebase deploy --only functions:deleteExpiredGames





10 ou 15 min de soutenance:
Arriver 5 min en avance au moins pour lancer l'app.
Parler de tous ce qu'on a fait : rèles firebase.


Foncitonnalité : 
Clean up tous les jours à 3h du matin les games finished de plus de 5 jours
Change waiting to finish tous les minutes si waiting plus de 5min
Change in_game to finish tous les minutes si in_game plus de 2*nb question + 5 min
Connexion google sign in
Site internet app hosting
Qr code pour taper le code


