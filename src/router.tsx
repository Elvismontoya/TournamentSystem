import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.tsx';
import { TournamentLayout } from './layouts/TournamentLayout.tsx';
import { TournamentsPage } from './pages/admin/TournamentsPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { BracketsPage } from './pages/tournament/BracketsPage.tsx';
import { GroupsPage } from './pages/tournament/GroupsPage.tsx';
import { MatchesPage } from './pages/tournament/MatchesPage.tsx';
import { OverviewPage } from './pages/tournament/OverviewPage.tsx';
import { ParticipantsPage } from './pages/tournament/ParticipantsPage.tsx';
import { SettingsPage } from './pages/tournament/SettingsPage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'mis-torneos', element: <TournamentsPage /> },
      {
        // Tournament dashboard: where everything about one tournament is managed
        path: 'torneos/:slug',
        element: <TournamentLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'participantes', element: <ParticipantsPage /> },
          { path: 'partidos', element: <MatchesPage /> },
          { path: 'grupos', element: <GroupsPage /> },
          { path: 'llaves', element: <BracketsPage /> },
          { path: 'configuracion', element: <SettingsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
