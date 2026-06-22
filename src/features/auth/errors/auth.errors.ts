export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class ProfileNotFoundError extends Error {
  constructor() {
    super('User profile not found');
    this.name = 'ProfileNotFoundError';
  }
}

export class InvalidProfileError extends Error {
  constructor() {
    super('Invalid user profile');
    this.name = 'InvalidProfileError';
  }
}

export class FirestorePermissionError extends Error {
  constructor() {
    super('Firestore permission denied');
    this.name = 'FirestorePermissionError';
  }
}

export class AuthNotEnabledError extends Error {
  constructor() {
    super('Email/password auth not enabled');
    this.name = 'AuthNotEnabledError';
  }
}

export class NetworkAuthError extends Error {
  constructor() {
    super('Network error');
    this.name = 'NetworkAuthError';
  }
}
