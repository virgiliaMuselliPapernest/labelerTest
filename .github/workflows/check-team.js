name: Auto Label Team PR (by Team Membership)

on:
  # Déclenche le workflow lors de la création ou de la réouverture d'une Pull Request.
  pull_request:
    types: [opened, reopened]

env:
  # ➡️ 1. REMPLACEZ CECI : Le SLUG de votre équipe (tout en minuscules, sans l'organisation).
  TEAM_SLUG: "app-b2c"
  # ➡️ 2. Le nom du label à appliquer. Assurez-vous qu'il existe dans le dépôt.
  PR_LABEL: "AppCore"

jobs:
  label_pr:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write # ESSENTIEL pour ajouter le label.

    steps:
      - name: Check Team Membership and Apply Label
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const teamSlug = process.env.TEAM_SLUG;
            const prAuthor = context.payload.pull_request.user.login;
            const org = context.repo.owner;
            const prNumber = context.issue.number;
            const label = process.env.PR_LABEL;

            console.log(`Checking if user ${prAuthor} is a member of team ${org}/${teamSlug}...`);

            try {
              // Appelle l'API REST de GitHub pour vérifier l'appartenance à l'équipe.
              // L'endpoint est : GET /orgs/{org}/teams/{team_slug}/memberships/{username}
              await github.rest.teams.getMembershipForUserInOrg({
                org: org,
                team_slug: teamSlug,
                username: prAuthor,
              });

              // Si la requête réussit, cela signifie que l'utilisateur est membre (statut 200).
              console.log(`✅ User ${prAuthor} is a member of the team! Applying label "${label}" to PR #${prNumber}.`);

              // Application du label à la Pull Request
              await github.rest.issues.addLabels({
                owner: org,
                repo: context.repo.repo,
                issue_number: prNumber,
                labels: [label],
              });

              console.log(`Label "${label}" applied successfully.`);

            } catch (error) {
              // Si la requête échoue (généralement statut 404), l'utilisateur n'est pas membre.
              if (error.status === 404) {
                console.log(`❌ User ${prAuthor} is NOT a member of the team. Skipping label.`);
              } else {
                console.error(`An error occurred:`, error.message);
                // Un statut 403 (Forbidden) indique généralement un problème de permission du GITHUB_TOKEN.
                throw new Error(`Failed to check team membership or apply label. Status: ${error.status}`);
              }
            }
