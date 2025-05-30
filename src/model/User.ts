export class User {
  userId: string;
  email: string;
  avatarImage: string;
  lobbiesIDs: string[];

  constructor(
    userId: string,
    email: string,
    avatarImage: string,
    lobbiesIDs: string[]
  ) {
    this.userId = userId;
    this.email = email;
    this.avatarImage = avatarImage;
    this.lobbiesIDs = lobbiesIDs;
  }

  addLobbies(newLobbies: string[]) {
    const set = new Set([...this.lobbiesIDs, ...newLobbies]);
    this.lobbiesIDs = Array.from(set);
  }

  toJSON() {
    return {
      userId: this.userId,
      email: this.email,
      avatarImage: this.avatarImage,
      lobbiesIDs: this.lobbiesIDs,
    };
  }
}
