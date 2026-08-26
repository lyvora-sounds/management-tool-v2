import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import db from "@/lib/db";
import { hasBoardAccess } from "@/lib/boardAccess";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await hasBoardAccess(user.id, boardId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isOwner = board.userId === user.id;

  const [members, invitations] = await Promise.all([
    db.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    isOwner
      ? db.invitation.findMany({
          where: { boardId, status: "pending" },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    owner: board.user,
    members,
    invitations,
    isOwner,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board || board.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { email } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingMember = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existingMember) {
    const alreadyMember = await db.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: existingMember.id } },
    });
    if (alreadyMember || existingMember.id === user.id) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }
  }

  const existing = await db.invitation.findFirst({
    where: { boardId, email: normalizedEmail, status: "pending" },
  });
  if (existing) {
    return NextResponse.json({ error: "Already invited" }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await db.invitation.create({
    data: { email: normalizedEmail, boardId, expiresAt },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

  const inviterName = user.name ?? user.email;
  const year = new Date().getFullYear();

  let emailError: unknown = null;
  try {
    const { error } = await resend.emails.send({
      from: "no-reply@kikiboard.xyz",
      to: normalizedEmail,
      subject: `${inviterName} te invita a "${board.title}"`,
      html: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invitación a Kiki</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
            <tr>
              <td style="background:#09090b;padding:24px 32px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <div style="width:28px;height:28px;background:#ffffff20;border-radius:6px;display:inline-block;text-align:center;line-height:28px;font-size:16px;">⊞</div>
                    </td>
                    <td>
                      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Kiki</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 24px;">
                <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;">Invitación a colaborar</p>
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#09090b;line-height:1.3;">Te han invitado a un board</h1>
                <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
                  <strong style="color:#09090b;">${inviterName}</strong> te ha invitado a colaborar en el board
                  <strong style="color:#09090b;">"${board.title}"</strong> en Kiki.
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background:#09090b;">
                      <a href="${inviteUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
                        Aceptar invitación →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;">
                  O copia este enlace en tu navegador:<br/>
                  <a href="${inviteUrl}" style="color:#09090b;word-break:break-all;">${inviteUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <hr style="border:none;border-top:1px solid #f0f0f0;margin:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;">
                <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                  Este enlace expira en <strong>7 días</strong>. Si no esperabas esta invitación, puedes ignorar este email con seguridad.
                </p>
                <p style="margin:10px 0 0;font-size:12px;color:#d4d4d8;">
                  © ${year} Kiki · Gestión de proyectos
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    });
    emailError = error;
  } catch (err) {
    emailError = err;
  }

  if (emailError) {
    console.error("[RESEND ERROR]", emailError);
    return NextResponse.json({ error: "Invitación creada pero no se pudo enviar el email" }, { status: 500 });
  }

  return NextResponse.json(invitation, { status: 201 });
}
