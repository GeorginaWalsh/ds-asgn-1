import {Movie, MovieReview} from '../shared/types'

export const movies : Movie[] = [
  {
    movieId: 1234,
    genre_ids: [28, 14, 32],
    original_language: 'en',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-20",
    title: "Title 1234",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieId: 4567,
    genre_ids: [28, 14, 32],
    original_language: 'fr',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-20",
    title: "Title 1234",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieId: 2345,
    genre_ids: [28, 14, 32],
    original_language: 'en',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-21",
    title: "Title 2345",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
  {
    movieId: 3456,
    genre_ids: [28, 14, 32],
    original_language: 'en',
    overview:
      "Every six years, an ancient order of jiu-jitsu fighters joins forces to battle a vicious race of alien invaders. But when a celebrated war hero goes down in defeat, the fate of the planet and mankind hangs in the balance.",
    popularity: 2633.943,
    release_date: "2020-11-21",
    title: "Title 3456",
    video: false,
    vote_average: 5.9,
    vote_count: 111,
  },
];

export const movieReviews: MovieReview[] = [
  {
    movieId: 1234,
    reviewerName: "Joe Bloggs",
    reviewDate: "2023-10-20",
    content: "5 stars - amazing",
  },
  {
    movieId: 1234,
    reviewerName: "Alice Broggs",
    reviewDate: "2023-05-03",
    content: "4 stars - couldn't stop watching",
  },
  {
    movieId: 1234,
    reviewerName: "Joe Cloggs",
    reviewDate: "2023-11-16",
    content: "3 stars - would watch again",
  },
  {
    movieId: 2345,
    reviewerName: "Joe Bloggs",
    reviewDate: "2023-10-23",
    content: "2 stars - meh",
  },
  {
    movieId: 2345,
    reviewerName: "John Doe",
    reviewDate: "2023-10-30",
    content: "1 star - waste of time and money",
  },
];