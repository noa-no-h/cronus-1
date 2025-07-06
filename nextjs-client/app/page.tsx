import { getAllPosts } from '~/lib/blog';
import { Home } from '~/modules/home';
import HomeClient from '~/modules/home/HomeClient';

export default function HomePage() {
  const posts = getAllPosts();
  return (
    <HomeClient>
      <Home posts={posts} />
    </HomeClient>
  );
}
