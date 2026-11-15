package audit

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
)

func Event(ctx context.Context, log *slog.Logger, event string, attrs ...slog.Attr) {
	log.LogAttrs(ctx, slog.LevelInfo, "audit", append([]slog.Attr{slog.String("event", event)}, attrs...)...)
}

func Family(id uuid.UUID) slog.Attr  { return slog.String("family_id", id.String()) }
func Profile(id uuid.UUID) slog.Attr { return slog.String("profile_id", id.String()) }
func Actor(id uuid.UUID) slog.Attr   { return slog.String("actor_id", id.String()) }
func Session(id uuid.UUID) slog.Attr { return slog.String("session_id", id.String()) }
