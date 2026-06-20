import type { Schema, Struct } from '@strapi/strapi';

export interface SharedFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_faq_items';
  info: {
    description: 'A question and its answer, kept together for FAQPage schema and Oge grounding.';
    displayName: 'FAQ Item';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLegalSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_legal_sections';
  info: {
    description: 'A legal clause with its plain-language summary alongside (PRD legal pages).';
    displayName: 'Legal Section';
    icon: 'file';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    plainSummary: Schema.Attribute.Text;
  };
}

export interface SharedMetric extends Struct.ComponentSchema {
  collectionName: 'components_shared_metrics';
  info: {
    description: 'A verified proof metric: a label and its value (PRD proof bands, verified only).';
    displayName: 'Metric';
    icon: 'chartBubble';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Per-page SEO controls (PRD 9.11). Meta limits are enforced; the index toggle is plain language.';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedSource extends Struct.ComponentSchema {
  collectionName: 'components_shared_sources';
  info: {
    description: 'A cited data source or a local data point: a short label and an optional URL.';
    displayName: 'Source';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.faq-item': SharedFaqItem;
      'shared.legal-section': SharedLegalSection;
      'shared.metric': SharedMetric;
      'shared.seo': SharedSeo;
      'shared.source': SharedSource;
    }
  }
}
