export default function MentionsLegalesPage() {
    return (
        <main className="lg:container mx-auto py-10 px-4 max-w-3xl prose dark:prose-invert">
            <h1>Mentions légales</h1>
            <p className="text-sm text-muted-foreground">Conformément aux dispositions légales en vigueur en Algérie</p>

            <h2>Éditeur du site</h2>
            <p>
                <strong>Djaouad Azzouz</strong>
                <br />
                Opérant sous l&apos;enseigne <strong>SiferOne</strong>
                <br />
                Site web : <a href="https://siferone.com">siferone.com</a>
                <br />
                E-mail : <a href="mailto:contact@siferone.com">contact@siferone.com</a>
            </p>

            <h2>Directeur de la publication</h2>
            <p>Djaouad Azzouz</p>

            <h2>Hébergement</h2>
            <p>
                Ce site est hébergé par un prestataire cloud. Les coordonnées exactes de l&apos;hébergeur sont disponibles
                sur demande à <a href="mailto:contact@siferone.com">contact@siferone.com</a>.
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>
                L&apos;ensemble des contenus présents sur FacturApp (textes, graphiques, logo, code source) sont protégés
                par le droit d&apos;auteur algérien (Ordonnance n°03-05 du 19 juillet 2003 relative aux droits d&apos;auteur et
                droits voisins). Toute reproduction, représentation, modification, publication ou adaptation de tout
                ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf
                autorisation écrite préalable de l&apos;Éditeur.
            </p>

            <h2>Données personnelles</h2>
            <p>
                Le traitement des données personnelles des utilisateurs est décrit dans notre{" "}
                <a href="/confidentialite">Politique de confidentialité</a>, conformément à la Loi algérienne n°18-07
                du 10 juin 2018.
            </p>

            <h2>Conditions d&apos;utilisation</h2>
            <p>
                L&apos;utilisation du service FacturApp est soumise aux{" "}
                <a href="/cgu">Conditions Générales d&apos;Utilisation</a>.
            </p>

            <h2>Limitation de responsabilité</h2>
            <p>
                FacturApp fournit des outils de facturation à titre indicatif. L&apos;exactitude fiscale des documents
                relève de la responsabilité de l&apos;utilisateur. L&apos;Éditeur recommande de faire valider les documents
                par un comptable agréé ou un conseiller fiscal.
            </p>

            <h2>Droit applicable</h2>
            <p>
                Les présentes mentions légales sont soumises au droit algérien. Tout litige sera soumis aux
                juridictions compétentes en Algérie.
            </p>
        </main>
    );
}
