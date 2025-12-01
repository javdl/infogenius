# Deploying InfoGenius to Google Cloud Run

This guide covers deploying InfoGenius to Google Cloud Run with IAP (Identity-Aware Proxy) authentication.

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and authenticated
- A GCP project with billing enabled
- Gemini API key

## Configuration

| Setting | Value |
|---------|-------|
| Project ID | `gen-lang-client-0822324815` |
| Region | `europe-west4` |
| Service Name | `infogenius` |
| Authentication | IAP (Identity-Aware Proxy) |

## Step 1: Enable Required APIs

```bash
gcloud services enable compute.googleapis.com --project=gen-lang-client-0822324815
gcloud services enable iap.googleapis.com --project=gen-lang-client-0822324815
gcloud services enable cloudresourcemanager.googleapis.com --project=gen-lang-client-0822324815
```

## Step 2: Create Secret for API Key

Create the secret in Secret Manager:

```bash
echo -n "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY \
  --project=gen-lang-client-0822324815 \
  --data-file=-
```

Or via the console: https://console.cloud.google.com/security/secret-manager?project=gen-lang-client-0822324815

## Step 3: Deploy to Cloud Run

⚠️ **Security Note**: This app uses client-side Gemini API calls, which means the API key is baked into the JavaScript bundle at build time. While protected by IAP, anyone with access can extract the key from the browser. For production use, consider implementing a backend proxy server.

### Get the API Key Value

First, retrieve the API key from Secret Manager:

```bash
GEMINI_KEY=$(gcloud secrets versions access latest \
  --secret=GEMINI_API_KEY \
  --project=gen-lang-client-0822324815)
```

### Deploy with Build Arg

Deploy the service, passing the API key as a build argument:

```bash
gcloud run deploy infogenius \
  --source . \
  --region europe-west4 \
  --project gen-lang-client-0822324815 \
  --set-build-env-vars GEMINI_API_KEY="$GEMINI_KEY" \
  --no-allow-unauthenticated \
  --port 8080
```

If the deployment fails with a secret access error, grant the Cloud Build service account access to the secret:

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --project gen-lang-client-0822324815 \
  --member="serviceAccount:596433820578@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Then retry the deploy command.

## Step 4: Enable IAP on Cloud Run

Enable IAP directly on the Cloud Run service:

```bash
gcloud beta run services update infogenius \
  --region=europe-west4 \
  --project=gen-lang-client-0822324815 \
  --iap
```

Note: If this is the first time enabling IAP, you may see a warning about the service agent needing to propagate. Wait 30 seconds and retry the command.

## Step 5: Configure IAP Access

Grant access to users from a specific domain (e.g., @fashionunited.com):

```bash
gcloud beta iap web add-iam-policy-binding \
  --project=gen-lang-client-0822324815 \
  --resource-type=cloud-run \
  --service=infogenius \
  --region=europe-west4 \
  --member="domain:fashionunited.com" \
  --role="roles/iap.httpsResourceAccessor"
```

To grant access to a specific user:

```bash
gcloud beta iap web add-iam-policy-binding \
  --project=gen-lang-client-0822324815 \
  --resource-type=cloud-run \
  --service=infogenius \
  --region=europe-west4 \
  --member="user:email@example.com" \
  --role="roles/iap.httpsResourceAccessor"
```

## Service URL

After deployment, the service is available at:

https://infogenius-596433820578.europe-west4.run.app

Users will be prompted to authenticate with their Google account. Only users matching the IAP policy (e.g., @fashionunited.com domain) will be granted access.

## Updating the Deployment

To deploy updates, run the deploy command again from the project root:

```bash
GEMINI_KEY=$(gcloud secrets versions access latest \
  --secret=GEMINI_API_KEY \
  --project=gen-lang-client-0822324815)

gcloud run deploy infogenius \
  --source . \
  --region europe-west4 \
  --project gen-lang-client-0822324815 \
  --set-build-env-vars GEMINI_API_KEY="$GEMINI_KEY" \
  --no-allow-unauthenticated \
  --port 8080
```

## Disabling IAP

To disable IAP and make the service publicly accessible:

```bash
gcloud beta run services update infogenius \
  --region=europe-west4 \
  --project=gen-lang-client-0822324815 \
  --no-iap

gcloud run services add-iam-policy-binding infogenius \
  --region=europe-west4 \
  --project=gen-lang-client-0822324815 \
  --member="allUsers" \
  --role="roles/run.invoker"
```
