build apk 
ionic build
npx cap sync
cd .\android\
.\gradlew assembleDebug


connexion google :
cd android
.\gradlew signingReport
copie SHA1 dnas firebase



npm install
npm install -g firebase-tools
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
Qr code pour taper le code et rejoindre la game
Score par question et Score final avec classement


Scénario : 
PCs se connectent sur le site internet.
1 pc = Création du compte via formulaire register ordi + validation email + Connexion normal
1 PC = Forget password -> connexion normal
1 IOS = Connexion google 
1 Android = Connexion google, nouveau = monter le pseudo


Home : 
1 Android crée un Quizz + IOS rejoint le Quizz pour montrer qu'il est valide.
Les deux quittent et montre l'Historique.

1 IOS montre les Quizz admin qu'il a et lancer un jeu.
Tous le mond 2PC et Android rejoint la partie -> PC avec un code et android avec QR Code

3 eme questions android se deconnecte sans remplir la question, puis rejoint la partie à la 4 ème.
A la fin du quizz on montre les statistiques.


Clean up tous les jours à 3h du matin les games finished de plus de 5 jours
Change waiting to finish tous les minutes si waiting plus de 5min
Change in_game to finish tous les minutes si in_game plus de 2*nb question + 5 min

Insitier sur disponible sur IOS, android et web -> Logo personnel 

