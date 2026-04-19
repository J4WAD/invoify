export default function CGUPage() {
    return (
        <main className="lg:container mx-auto py-10 px-4 max-w-3xl prose dark:prose-invert">
            <h1>Conditions Générales d&apos;Utilisation</h1>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : 18 avril 2026</p>

            <h2>1. Objet</h2>
            <p>
                Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation du
                service <strong>FacturApp</strong>, application de facturation en ligne éditée par{" "}
                <strong>Djaouad Azzouz / SiferOne</strong> (ci-après « l&apos;Éditeur »). Tout accès au service implique
                l&apos;acceptation pleine et entière des présentes CGU.
            </p>

            <h2>2. Accès au service</h2>
            <p>
                FacturApp est réservé aux professionnels (auto-entrepreneurs, TPE, PME) exerçant une activité légale sur
                le territoire algérien ou à l&apos;international. L&apos;utilisation à des fins personnelles ou frauduleuses est
                strictement interdite.
            </p>
            <p>
                L&apos;accès requiert la création d&apos;un compte avec un identifiant et un mot de passe. L&apos;utilisateur est seul
                responsable de la confidentialité de ses identifiants.
            </p>

            <h2>3. Fonctionnalités</h2>
            <p>
                FacturApp permet notamment de : créer et gérer des factures, devis, bons de livraison et autres
                documents commerciaux ; exporter ces documents en PDF ; envoyer des documents par e-mail ; gérer un
                carnet d&apos;adresses clients.
            </p>

            <h2>4. Obligations de l&apos;utilisateur</h2>
            <ul>
                <li>Fournir des informations exactes lors de la création du compte.</li>
                <li>S&apos;assurer de la conformité fiscale des documents émis avec la législation algérienne en vigueur.</li>
                <li>Ne pas utiliser le service à des fins illicites ou contraires aux bonnes mœurs.</li>
                <li>Ne pas tenter de contourner les mesures de sécurité du service.</li>
            </ul>

            <h2>5. Propriété intellectuelle</h2>
            <p>
                L&apos;ensemble des éléments constitutifs du service (code source, interfaces, logos) sont la propriété
                exclusive de l&apos;Éditeur ou de ses concédants de licence. Toute reproduction, distribution ou
                modification sans autorisation préalable est interdite.
            </p>

            <h2>6. Responsabilité</h2>
            <p>
                L&apos;Éditeur met en œuvre tous les moyens raisonnables pour assurer la disponibilité et la sécurité du
                service, mais ne saurait être tenu responsable : des interruptions de service, des pertes de données
                dues à des événements hors de son contrôle, ou de l&apos;inexactitude des calculs fiscaux si les paramètres
                renseignés par l&apos;utilisateur sont erronés.
            </p>
            <p>
                Il appartient à l&apos;utilisateur de vérifier la conformité de ses documents avec son conseiller fiscal ou
                comptable.
            </p>

            <h2>7. Protection des données personnelles</h2>
            <p>
                Le traitement des données personnelles est régi par notre{" "}
                <a href="/confidentialite">Politique de confidentialité</a>, conformément à la Loi algérienne n°18-07
                du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à
                caractère personnel.
            </p>

            <h2>8. Modification des CGU</h2>
            <p>
                L&apos;Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
                informés de toute modification substantielle par notification dans l&apos;application. La poursuite de
                l&apos;utilisation du service après notification vaut acceptation des nouvelles CGU.
            </p>

            <h2>9. Droit applicable et juridiction</h2>
            <p>
                Les présentes CGU sont soumises au droit algérien. Tout litige relatif à leur interprétation ou
                exécution relève de la compétence exclusive des tribunaux algériens compétents.
            </p>

            <hr />
            <p className="text-sm text-muted-foreground">
                Contact : <a href="mailto:contact@siferone.com">contact@siferone.com</a>
            </p>
        </main>
    );
}
