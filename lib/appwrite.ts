import {
  Client,
  Avatars,
  Account,
  OAuthProvider,
  Databases,
  Query,
} from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

//our variables for appwrite
export const config = {
  platform: "com.kk.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  galleriesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  propertiesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
};

//define and export new version of appwrite client
export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

// define which different functionalities we're going to use from appwrite

//avatar - generate image avatar based on user's first and last name (KK)
export const avatar = new Avatars(client);
//allow us to create new user accounts
export const account = new Account(client);

export const databases = new Databases(client);

//create new action

//login functionality - false = wrong | true = success
export async function login() {
  try {
    //generate redirect uri to handle Oauth response -- come back to application after signing in to Google

    //generate redirect uri to homepage
    const redirectUri = Linking.createURL("/");

    //request oauth token from appwrite using google provider
    const response = account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );

    if (!response) {
      throw new Error("Failed to login");
    }
    //if successfully create OAuth2 token, then open web browser session for oAuth to continue
    //like when you are in an app, and it opens a mobile browser
    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    if (browserResult.type !== "success") throw new Error("Failed to login");

    //if everything went right, parse newly returned url to extract query parameters
    const url = new URL(browserResult.url);

    //extract secret and userID
    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();

    if (!secret || !userId) throw new Error("Failed to login");

    //if pass, can create new account session
    const session = await account.createSession(userId, secret);
    if (!session) throw new Error("Failed to create new session");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

//logout functionality
export async function logout() {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

//allow us to fetch info about currently logged in user
export async function getUser() {
  try {
    const response = await account.get();

    if (response.$id) {
      //form user avatar (image with user initials)
      const userAvatar = avatar.getInitials(response.name);
      return {
        ...response,
        avatar: userAvatar.toString(),
      };
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

//fetch "Featured" properties
export async function getLatestProperties() {
  try {
    const res = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(5)]
    );
    return res.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

//allow for querying, filtering and more

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("type", filter));

    if (query) {
      buildQuery.push(
        Query.or([
          Query.search("name", query),
          Query.search("address", query),
          Query.search("type", query),
        ])
      );
    }

    if (limit) buildQuery.push(Query.limit(limit));

    const res = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery
    );
    return res.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}
