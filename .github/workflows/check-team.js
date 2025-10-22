// Fichier: .github/workflows/check-team.js

const { Octokit } = require("@octokit/rest");

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.ORGANIZATION;
  const teamSlug = process.env.TEAM_SLUG;
  const username = process.env.PR_AUTHOR;
  const prNumber = process.env.PR_NUMBER;
  const label = process.env.PR_LABEL;

  if (!token || !org || !teamSlug || !username || !prNumber || !label) {
    console.error("Missing environment variables.");
    process.exit(1);
  }

  // Initialisation du client GitHub (Octokit)
  const octokit = new Octokit({ auth: token });
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];

  console.log(`Checking if user ${username} is a member of team ${org}/${teamSlug}...`);

  try {
    // 1. Vérification de l'appartenance à l'équipe via l'API REST de GitHub
    // endpoint: GET /orgs/{org}/teams/{team_slug}/memberships/{username}
    await octokit.teams.getMembershipForUserInOrg({
      org: org,
      team_slug: teamSlug,
      username: username,
    });

    // Si la requête réussit, l'utilisateur est membre de l'équipe.
    console.log(`✅ User ${username} is a member of the team! Applying label "${label}" to PR #${prNumber}.`);

    // 2. Application du label à la Pull Request
    await octokit.issues.addLabels({
      owner: org,
      repo: repo,
      issue_number: prNumber,
      labels: [label],
    });

    console.log(`Label "${label}" applied successfully.`);

  } catch (error) {
    // Si la requête échoue avec un code 404, l'utilisateur n'est pas membre ou le jeton n'a pas la permission.
    if (error.status === 404) {
      console.log(`❌ User ${username} is NOT a member of the team or team slug is wrong. Skipping label.`);
    } else {
      console.error(`An error occurred while checking team membership or adding label:`, error.message);
      // NOTE: Un code 403 (Forbidden) indique souvent un problème de permission avec le GITHUB_TOKEN.
    }
  }
}

// Pour utiliser 'require' dans le script Node.js sans installer Octokit à chaque fois, 
// nous allons simuler un `npm install` dans le workflow YAML.
// Cependant, pour simplifier, nous allons utiliser directement l'API REST de GitHub
// via un simple `curl` (méthode encore plus simple) ou en ajoutant une étape d'installation.

// Mieux : ajoutons l'installation simple au YAML, c'est plus propre que curl.
// Le script JS doit être exécuté :
run();
