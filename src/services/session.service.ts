import { DocumentDefinition, FilterQuery } from "mongoose";
import { Session } from "../models";
import { SessionDocument, SessionInput } from "../models/session.model";

export async function createSession(
  input: DocumentDefinition<SessionInput>
): Promise<SessionDocument | boolean> {
  try {
    const session = await Session.create(input);
    return session;
  } catch (error: any) {
    return false;
  }
}

export async function createOrUpdate(
  query: FilterQuery<SessionInput>,
  update: DocumentDefinition<SessionInput>,
  options = {}
): Promise<SessionDocument | boolean | null> {
  try {
    const session = await Session.findOneAndUpdate(query, update, options);
    return session;
  } catch (error: any) {
    return false;
  }
}
