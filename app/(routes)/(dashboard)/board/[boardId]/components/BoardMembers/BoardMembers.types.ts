export type BoardOwner = {
  id: string;
  name: string | null;
  email: string;
};

export type Member = {
  id: string;
  role: string;
  user: { name: string | null; email: string };
};

export type Invitation = {
  id: string;
  email: string;
  createdAt: string;
};

export type Props = {
  boardId: string;
  open: boolean;
  onClose: () => void;
};
