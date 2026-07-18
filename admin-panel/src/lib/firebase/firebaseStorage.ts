import { getStorage } from "firebase/storage";
import app from "./firebaseClient";

export const storage = getStorage(app);
