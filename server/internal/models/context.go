package models

import (
	"context"
	"slices"
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	Parent Role = "PARENT"
	Child  Role = "CHILD"
)

type Device struct {
	SessionID uuid.UUID
	FamilyID  uuid.UUID
}

type Caller struct {
	FamilyID        uuid.UUID
	FamilySessionID uuid.UUID
	SessionID       uuid.UUID
	ProfileID       uuid.UUID
	Role            Role
	IsOwner         bool
	Timezone        string
	ExpiresAt       time.Time
	Permissions     []string
	Modules         []Module
}

func (c Caller) Can(perm string) bool {
	_, found := slices.BinarySearch(c.Permissions, perm)
	return found
}

func (c Caller) ModuleEnabled(id string) bool {
	return slices.ContainsFunc(c.Modules, func(m Module) bool { return m.ID == id })
}

type (
	deviceKey struct{}
	callerKey struct{}
)

func WithDevice(ctx context.Context, d Device) context.Context {
	return context.WithValue(ctx, deviceKey{}, d)
}

func DeviceFrom(ctx context.Context) Device {
	d, _ := ctx.Value(deviceKey{}).(Device)
	return d
}

func WithCaller(ctx context.Context, c Caller) context.Context {
	return context.WithValue(ctx, callerKey{}, c)
}

func CallerFrom(ctx context.Context) (Caller, bool) {
	c, ok := ctx.Value(callerKey{}).(Caller)
	return c, ok
}
