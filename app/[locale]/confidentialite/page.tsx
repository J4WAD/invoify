export default function ConfidentialitePage() {
    return (
        <main className="lg:container mx-auto py-10 px-4 max-w-3xl prose dark:prose-invert">
            <h1>Politique de confidentialité</h1>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : 18 avril 2026</p>

            <p>
                La présente politique décrit la manière dont <strong>FacturApp</strong> (éditée par Djaouad Azzouz /
                SiferOne) collecte, utilise et protège vos données personnelles, conformément à la{" "}
                <strong>Loi algérienne n°18-07 du 10 juin 2018</strong> relative à la protection des personnes
                physiques dans le traitement des données à caractère personnel.
            </p>

            <h2>1. Responsable du traitement</h2>
            <p>
                <strong>Djaouad Azzouz / SiferOne</strong>
                <br />
                Site web : <a href="https://siferone.com">siferone.com</a>
                <br />
                Contact DPO : <a href="mailto:privacy@siferone.com">privacy@siferone.com</a>
            </p>

            <h2>2. Données collectées</h2>
            <h3>2.1 Données de compte</h3>
            <ul>
                <li>Identifiant (nom d&apos;utilisateur)</li>
                <li>Adresse e-mail (pour la réinitialisation de mot de passe)</li>
                <li>Mot de passe haché (bcrypt, jamais stocké en clair)</li>
            </ul>

            <h3>2.2 Données professionnelles</h3>
            <ul>
                <li>Informations de profil : nom commercial, adresse, NIF, NIS, RC, AI</li>
                <li>Informations clients : nom, adresse, coordonnées</li>
                <li>Documents commerciaux : factures, devis et leurs contenus</li>
            </ul>

            <h3>2.3 Données techniques</h3>
            <ul>
                <li>Journaux d&apos;accès (adresse IP, agent utilisateur) conservés 30 jours</li>
                <li>Cookies de session (nécessaires au fonctionnement)</li>
            </ul>

            <h2>3. Finalités et bases légales</h2>
            <table>
                <thead>
                    <tr>
                        <th>Finalité</th>
                        <th>Base légale</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Fourniture du service de facturation</td>
                        <td>Exécution du contrat</td>
                    </tr>
                    <tr>
                        <td>Sécurité du compte (anti-bruteforce)</td>
                        <td>Intérêt légitime</td>
                    </tr>
                    <tr>
                        <td>Envoi d&apos;e-mails transactionnels</td>
                        <td>Exécution du contrat</td>
                    </tr>
                    <tr>
                        <td>Conformité légale et fiscale</td>
                        <td>Obligation légale</td>
                    </tr>
                </tbody>
            </table>

            <h2>4. Durée de conservation</h2>
            <ul>
                <li><strong>Données de compte</strong> : durée de vie du compte + 1 an après suppression</li>
                <li><strong>Documents fiscaux</strong> : 10 ans (obligation légale DGI)</li>
                <li><strong>Journaux d&apos;accès</strong> : 30 jours</li>
                <li><strong>Tokens de réinitialisation</strong> : 1 heure (expiration automatique)</li>
            </ul>

            <h2>5. Destinataires des données</h2>
            <p>
                Vos données ne sont pas vendues à des tiers. Elles peuvent être transmises à des sous-traitants
                techniques dans le strict cadre de la fourniture du service (hébergement, envoi d&apos;e-mails). Tout
                sous-traitant est soumis à des engagements contractuels de confidentialité.
            </p>

            <h2>6. Transferts internationaux</h2>
            <p>
                Les données peuvent être hébergées sur des serveurs situés hors d&apos;Algérie (ex : fournisseurs cloud
                européens). Ces transferts s&apos;effectuent dans le respect de la Loi 18-07 et avec des garanties
                appropriées (clauses contractuelles types).
            </p>

            <h2>7. Vos droits</h2>
            <p>Conformément à la Loi 18-07, vous disposez des droits suivants :</p>
            <ul>
                <li><strong>Accès</strong> : obtenir une copie de vos données</li>
                <li><strong>Rectification</strong> : corriger des données inexactes</li>
                <li><strong>Effacement</strong> : demander la suppression de votre compte</li>
                <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
                <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
            </ul>
            <p>
                Pour exercer ces droits, contactez : <a href="mailto:privacy@siferone.com">privacy@siferone.com</a>.
                Nous répondrons dans un délai de 30 jours.
            </p>

            <h2>8. Sécurité</h2>
            <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement HTTPS,
                hachage des mots de passe (bcrypt), verrouillage de compte après tentatives échouées, en-têtes de
                sécurité HTTP (HSTS, CSP, X-Frame-Options).
            </p>

            <h2>9. Cookies</h2>
            <p>
                FacturApp utilise uniquement des cookies strictement nécessaires au fonctionnement du service
                (session d&apos;authentification). Aucun cookie publicitaire ou de traçage tiers n&apos;est déposé.
            </p>

            <h2>10. Contact et réclamations</h2>
            <p>
                Pour toute question relative à cette politique :{" "}
                <a href="mailto:privacy@siferone.com">privacy@siferone.com</a>
                <br />
                Vous pouvez également saisir l&apos;autorité nationale compétente (ANPDP — Autorité Nationale de Protection
                des Données Personnelles).
            </p>
        </main>
    );
}
