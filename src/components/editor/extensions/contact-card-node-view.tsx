"use client";

import Image from "next/image";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Plus, X, Mail, Phone, ImageIcon, UserRound } from "lucide-react";
import type { ContactPerson } from "./contact-card-node";

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const GRADIENTS = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#48c6ef", "#6f86d6"],
  ["#ff9a9e", "#fecfef"],
] as const;

function getGradient(name: string): readonly [string, string] {
  const idx = (name.charCodeAt(0) || 0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  "w-full bg-transparent outline-none border-b border-transparent " +
  "hover:border-border focus:border-primary transition-colors placeholder:text-muted-foreground/50";

// ─── Single contact card ──────────────────────────────────────────────────────

function ContactCard({
  contact,
  onChange,
  onRemove,
}: {
  contact: ContactPerson;
  onChange: (patch: Partial<ContactPerson>) => void;
  onRemove: () => void;
}) {
  const [c1, c2] = getGradient(contact.name || "A");

  return (
    <div className="relative group bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-md">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10"
        title="Remove contact"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>

      {/* Avatar + Name + Title */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {contact.photo ? (
            <Image
              src={contact.photo}
              alt={contact.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20 select-none"
              style={{
                background: `linear-gradient(135deg, ${c1}, ${c2})`,
              }}
            >
              {contact.name ? getInitials(contact.name) : <UserRound className="h-5 w-5" />}
            </div>
          )}
        </div>

        {/* Name + Title */}
        <div className="flex-1 min-w-0 pt-1 pr-6">
          <input
            value={contact.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Full Name"
            className={`${inputCls} font-semibold text-sm`}
          />
          <input
            value={contact.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Job Title"
            className={`${inputCls} text-xs text-muted-foreground mt-1.5`}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Contact details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={contact.email}
            onChange={(e) => onChange({ email: e.target.value })}
            type="email"
            placeholder="email@company.com"
            className={`${inputCls} text-xs flex-1`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={contact.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            type="tel"
            placeholder="+1 (555) 000-0000"
            className={`${inputCls} text-xs flex-1`}
          />
        </div>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={contact.photo}
            onChange={(e) => onChange({ photo: e.target.value })}
            placeholder="Photo URL (optional)"
            className={`${inputCls} text-xs text-muted-foreground flex-1`}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main node view ───────────────────────────────────────────────────────────

export function ContactCardNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const contacts: ContactPerson[] = node.attrs.contacts || [];

  const updateContact = (id: string, patch: Partial<ContactPerson>) => {
    updateAttributes({
      contacts: contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const addContact = () => {
    const newContact: ContactPerson = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      title: "",
      email: "",
      phone: "",
      photo: "",
    };
    updateAttributes({ contacts: [...contacts, newContact] });
  };

  const removeContact = (id: string) => {
    updateAttributes({ contacts: contacts.filter((c) => c.id !== id) });
  };

  return (
    <NodeViewWrapper
      data-type="contact-card"
      className={
        selected
          ? "ring-2 ring-primary rounded-2xl"
          : ""
      }
    >
      <div className="my-4 border border-dashed border-border rounded-2xl p-5 bg-muted/10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <UserRound className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Contact Cards</span>
        </div>

        {/* Cards grid */}
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <UserRound className="h-8 w-8 opacity-30" />
            <p className="text-sm">No contacts yet — add your first one</p>
          </div>
        ) : (
          <div
            className={
              contacts.length > 1
                ? "grid grid-cols-2 gap-3"
                : "grid grid-cols-1 gap-3"
            }
          >
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onChange={(patch) => updateContact(contact.id, patch)}
                onRemove={() => removeContact(contact.id)}
              />
            ))}
          </div>
        )}

        {/* Add button */}
        <div className="flex justify-center mt-4">
          <Button size="sm" variant="ghost" onClick={addContact}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Contact
          </Button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
