export class User {
  userID: string;
  email: string;
  username: string;
  avatarImage: string;
  lobbiesIDs: string[];

  constructor(
    userID: string,
    email: string,
    username: string,
    avatarImage: string,
    lobbiesIDs: string[]
  ) {
    this.userID = userID;
    this.email = email;
    this.username = username;
    this.avatarImage = avatarImage;
    this.lobbiesIDs = lobbiesIDs;
  }

  addLobbies(newLobbies: string[]) {
    const set = new Set([...this.lobbiesIDs, ...newLobbies]);
    this.lobbiesIDs = Array.from(set);
  }

  toJSON() {
    return {
      userID: this.userID,
      email: this.email,
      username: this.username,
      avatarImage: this.avatarImage,
      lobbiesIDs: this.lobbiesIDs,
    };
  }
}
